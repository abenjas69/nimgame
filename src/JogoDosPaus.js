
import { useEffect, useState } from "react";
import axios from "axios";

const session_id = localStorage.getItem("session_id") || crypto.randomUUID();
localStorage.setItem("session_id", session_id);

export default function JogoDosPaus() {
  const [estado, setEstado] = useState(null);
  const [linhaSelecionada, setLinhaSelecionada] = useState(null);
  const [pausSelecionados, setPausSelecionados] = useState([]);

  const fetchEstado = async () => {
    const res = await axios.get(`https://api-nim.onrender.com/estado?session_id=${session_id}`);
    setEstado(res.data);
  };

  const iniciarJogo = async () => {
    await axios.post(`https://api-nim.onrender.com/novo-jogo?session_id=${session_id}`);
    setLinhaSelecionada(null);
    setPausSelecionados([]);
    fetchEstado();
  };

  const fazerJogada = async () => {
    if (linhaSelecionada === null || pausSelecionados.length === 0) return;

    const inicio = Math.min(...pausSelecionados);
    const quantidade = pausSelecionados.length;

    await axios.post(`https://api-nim.onrender.com/jogada?session_id=${session_id}`, {
      linha: linhaSelecionada,
      inicio,
      quantidade,
    });

    setLinhaSelecionada(null);
    setPausSelecionados([]);
    await fetchEstado();

    const res = await axios.get(`https://api-nim.onrender.com/estado?session_id=${session_id}`);
    if (!res.data.jogo_terminado) {
      await axios.post(`https://api-nim.onrender.com/jogada-computador?session_id=${session_id}`);
      setLinhaSelecionada(null);
      setPausSelecionados([]);
      fetchEstado();
    }
  };

  const selecionarPau = (linhaIdx, pauIdx) => {
    if (!estado || estado.jogo_terminado) return;
    if (linhaSelecionada !== null && linhaSelecionada !== linhaIdx) return;

    const key = pauIdx;
    const selecionado = pausSelecionados.includes(key);
    if (selecionado) {
      setPausSelecionados(pausSelecionados.filter((idx) => idx !== key));
    } else {
      setLinhaSelecionada(linhaIdx);
      setPausSelecionados([...pausSelecionados, key]);
    }
  };

  useEffect(() => {
    fetchEstado();
  }, []);

  return (
    <div className="p-6 space-y-4 max-w-3xl mx-auto font-sans">
      <h1 className="text-3xl font-bold text-center">Jogo dos Paus</h1>

      <div className="flex justify-center gap-2 mb-4">
        <button onClick={iniciarJogo} className="bg-blue-500 text-white px-4 py-2 rounded">
          Novo Jogo
        </button>
        <button onClick={fazerJogada} className="bg-green-500 text-white px-4 py-2 rounded">
          Confirmar Jogada
        </button>
      </div>

      {estado && (
        <div className="space-y-3">
          <p className="text-center text-lg">XOR Total: {estado.xor_total}</p>
          {estado.jogo_terminado && (
            <p className="text-red-500 text-center font-semibold">Fim do jogo!</p>
          )}

          <div className="space-y-2 flex flex-col items-center">
            {estado.available_paus.map((linha, i) => (
              <div key={i} className="flex gap-1 justify-center">
                {linha.map((disponivel, j) => (
                  <button
                    key={j}
                    disabled={!disponivel || (linhaSelecionada !== null && linhaSelecionada !== i)}
                    className={`w-10 h-10 border text-xl font-bold rounded transition ${
                      !disponivel ? "bg-gray-300 text-gray-500" :
                      linhaSelecionada === i && pausSelecionados.includes(j)
                        ? "bg-red-500 text-white" : "bg-white"
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
