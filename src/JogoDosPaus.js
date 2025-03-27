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

export default function JogoDosPaus() {
  const [estado, setEstado] = useState(null);
  const [linhaSelecionada, setLinhaSelecionada] = useState(null);
  const [pausSelecionados, setPausSelecionados] = useState([]);

  const fetchEstado = async () => {
    const res = await axiosInstance.get("/estado");
    setEstado(res.data);
  };

  const iniciarJogo = async () => {
    await axiosInstance.post("/novo-jogo");
    fetchEstado();
    setLinhaSelecionada(null);
    setPausSelecionados([]);
  };

  const fazerJogada = async () => {
    if (linhaSelecionada === null || pausSelecionados.length === 0) return;
    const inicio = Math.min(...pausSelecionados);
    const quantidade = pausSelecionados.length;

    await axiosInstance.post("/jogada", {
      linha: linhaSelecionada,
      inicio,
      quantidade,
    });

    setLinhaSelecionada(null);
    setPausSelecionados([]);
    fetchEstado();
  };

  const jogadaComputador = async () => {
    await axiosInstance.post("/jogada-computador");
    fetchEstado();
  };

  const selecionarPau = (linhaIdx, pauIdx) => {
    if (!estado || estado.jogo_terminado) return;

    if (linhaSelecionada !== null && linhaSelecionada !== linhaIdx) return;

    const key = pauIdx;
    const selecionado = pausSelecionados.includes(key);

    if (selecionado) {
      const novaSelecao = pausSelecionados.filter((idx) => idx !== key);
      setPausSelecionados(novaSelecao);
      if (novaSelecao.length === 0) {
        setLinhaSelecionada(null);
      }
    } else {
      setLinhaSelecionada(linhaIdx);
      setPausSelecionados([...pausSelecionados, key]);
    }
  };

  useEffect(() => {
    fetchEstado();
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto font-sans">
      <h1 className="text-4xl font-bold text-center">Jogo dos Paus</h1>

      <div className="flex justify-center gap-4 mb-6 flex-wrap">
        <button onClick={iniciarJogo} className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg">
          Novo Jogo
        </button>
        <button onClick={fazerJogada} className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg">
          Confirmar Jogada
        </button>
        <button onClick={jogadaComputador} className="bg-purple-600 text-white px-6 py-3 rounded-lg text-lg">
          Jogada do Computador
        </button>
      </div>

      {estado && (
        <div className="space-y-4">
          <p className="text-center text-xl">XOR Total: {estado.xor_total}</p>
          {estado.jogo_terminado && (
            <p className="text-red-600 text-center font-semibold text-lg">Fim do jogo!</p>
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
    </div>
  );
}
