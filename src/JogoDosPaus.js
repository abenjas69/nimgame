import { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = "https://api-nim.onrender.com";

const getUserId = () => {
  let id = localStorage.getItem("user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("user_id", id);
  }
  return id;
};

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "X-User-ID": getUserId(),
  },
});

export default function NimGame() {
  const [estado, setEstado] = useState(null);
  const [linhaSelecionada, setLinhaSelecionada] = useState(null);
  const [pausSelecionados, setPausSelecionados] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [lastPlayer, setLastPlayer] = useState(null);
  const [error, setError] = useState("");

  const fetchEstado = async () => {
    const res = await axiosInstance.get("/estado");
    setEstado(res.data);
  };

  const iniciarJogo = async () => {
    await axiosInstance.post("/novo-jogo");
    fetchEstado();
    setLinhaSelecionada(null);
    setPausSelecionados([]);
    setLastPlayer(null);
    setError("");
  };

  const fazerJogada = async () => {
  if (lastPlayer === "user") {
    setError("You can't play twice in a row");
    return;
  }

  if (linhaSelecionada === null || pausSelecionados.length === 0) return;

  const inicio = Math.min(...pausSelecionados);
  const quantidade = pausSelecionados.length;

  // Verificar se todos os paus estão realmente disponíveis no backend
  const pausDisponiveis = estado.available_paus[linhaSelecionada];
  const todosDisponiveis = pausSelecionados.every((idx) => pausDisponiveis[idx]);

  if (!todosDisponiveis) {
    setError("Some selected sticks are no longer available.");
    return;
  }

  try {
    const res = await axiosInstance.post("/jogada", {
      linha: linhaSelecionada,
      inicio,
      quantidade,
    });
    setLastPlayer("user");
    setError("");
    setLinhaSelecionada(null);
    setPausSelecionados([]);
    fetchEstado();
  } catch (err) {
    setError(err?.response?.data?.erro || "Unknown error");
    console.error(err);
  }
};

  const jogadaComputador = async () => {
    if (lastPlayer === "computer") {
      setError("Computer cannot play 2 times in a row");
      return;
    }

    try {
      const res = await axiosInstance.post("/jogada-computador");
      setLastPlayer("computer");
      setError("");
      fetchEstado();
    } catch (err) {
      setError(err?.response?.data?.erro || "Unknown error");
      console.error(err);
    }
  };

  const selecionarPau = (linhaIdx, pauIdx) => {
    if (!estado || estado.jogo_terminado) return;

    const key = pauIdx;
    const selecionado = pausSelecionados.includes(key);

    if (!selecionado) {
      if (pausSelecionados.length > 0 && linhaSelecionada !== linhaIdx) {
        setError("You can only select sticks from one row");
        return;
      }

      const novaSelecao = [...pausSelecionados, key].sort((a, b) => a - b);

      const saoConsecutivos = novaSelecao.every((val, idx, arr) => {
        if (idx === 0) return true;
        return val === arr[idx - 1] + 1;
      });

      if (!saoConsecutivos) {
        setError("You can only select adjacent sticks");
        return;
      }

      if (pausSelecionados.length === 0) {
        setLinhaSelecionada(linhaIdx);
      }

      setPausSelecionados(novaSelecao);
      setError("");
    } else {
      const novaSelecao = pausSelecionados.filter((idx) => idx !== key);
      setPausSelecionados(novaSelecao);
      if (novaSelecao.length === 0) {
        setLinhaSelecionada(null);
      }
      setError("");
    }
  };

  useEffect(() => {
    fetchEstado();
  }, []);

  const vencedor = estado?.jogo_terminado
    ? lastPlayer === "user"
      ? "Computer wins!"
      : "You win!"
    : null;

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto font-sans">
      <h1 className="text-4xl font-bold text-center">Nim Game</h1>

      <div className="flex justify-center gap-4 mb-6 flex-wrap">
        <button onClick={iniciarJogo} className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg">
          New Game
        </button>
        <button onClick={fazerJogada} className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg">
          Confirm Move
        </button>
        <button onClick={jogadaComputador} className="bg-purple-600 text-white px-6 py-3 rounded-lg text-lg">
          Computer Move
        </button>
      </div>

      {error && <p className="text-red-600 text-center font-semibold">{error}</p>}

      {estado && (
        <div className="space-y-4">
          <p className="text-center text-xl">Total XOR: {estado.xor_total}</p>
          {estado.jogo_terminado && (
            <>
              <p className="text-center text-2xl font-bold text-green-700">{vencedor}</p>
              <p className="text-red-600 text-center font-semibold text-lg">Game Over!</p>
            </>
          )}

          <div className="space-y-3 flex flex-col items-center">
            {estado.available_paus.map((linha, i) => (
              <div key={i} className="flex gap-3 justify-center">
                {linha.map((disponivel, j) => (
                  <button
                    key={j}
                    disabled={!disponivel || (linhaSelecionada !== null && linhaSelecionada !== i)}
                    className={`w-14 h-14 border-2 text-2xl font-bold rounded-xl transition ${
                      !disponivel
                        ? "bg-gray-300 text-gray-500"
                        : linhaSelecionada === i && pausSelecionados.includes(j)
                        ? "bg-red-600 text-white"
                        : "bg-white"
                    }`}
                    onClick={() => selecionarPau(i, j)}
                  >
                    {disponivel ? "|" : "✖"}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center mt-8">
        <button
          onClick={() => setShowRules(!showRules)}
          className="bg-gray-700 text-white px-5 py-2 rounded-lg"
        >
          Game Rules
        </button>
        {showRules && (
          <div className="mt-4 text-left max-w-xl mx-auto bg-gray-100 p-4 rounded shadow">
            <p>Players take turns</p>
            <p>Removal of elements from a line is exclusively one turn</p>
            <p>Restriction: quantity of elements removed is limited to the selected line and if selecting more than one element, they must be adjacent</p>
            <p>Terminal objective: force the opponent to capture the last element</p>
            <p className="italic text-sm mt-2">NOTE: If the computer makes the first move, it always wins!!!</p>
          </div>
        )}
        <p className="mt-6 text-gray-600 text-sm">Authors: Tiago Mendes; Diogo Borges; Daniel Lima; Afonso Silva; Tiago Pinto; João Barroso and Arsénio Reis</p>
      </div>
    </div>
  );
}
