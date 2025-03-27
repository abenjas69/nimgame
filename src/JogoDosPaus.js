
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from uuid import uuid4

app = Flask(__name__)
app.secret_key = 'supersecretkey'
CORS(app, supports_credentials=True)

# Funções de lógica do jogo
def estado_inicial():
    return {
        "available_paus": [
            [1],
            [1, 1],
            [1, 1, 1],
            [1, 1, 1, 1]
        ],
        "jogo_terminado": False,
        "xor_total": 0
    }

def calcular_xor(estado):
    return eval("^".join(str(sum(linha)) for linha in estado["available_paus"]))

@app.before_request
def garantir_sessao():
    if "id" not in session:
        session["id"] = str(uuid4())
    if "estado" not in session:
        session["estado"] = estado_inicial()

@app.route("/estado")
def estado():
    estado = session.get("estado", estado_inicial())
    estado["xor_total"] = calcular_xor(estado)
    return jsonify(estado)

@app.route("/novo-jogo", methods=["POST"])
def novo_jogo():
    session["estado"] = estado_inicial()
    return jsonify(session["estado"])

@app.route("/jogada", methods=["POST"])
def jogada():
    data = request.json
    estado = session["estado"]
    linha, inicio, quantidade = data["linha"], data["inicio"], data["quantidade"]
    for i in range(inicio, inicio + quantidade):
        if i < len(estado["available_paus"][linha]):
            estado["available_paus"][linha][i] = 0
    estado["jogo_terminado"] = all(all(p == 0 for p in linha) for linha in estado["available_paus"])
    session["estado"] = estado
    return jsonify(success=True)

@app.route("/jogada-computador", methods=["POST"])
def jogada_computador():
    estado = session["estado"]
    for i, linha in enumerate(estado["available_paus"]):
        count = sum(linha)
        if count > 0:
            for j in range(len(linha)):
                if linha[j] == 1:
                    linha[j] = 0
                    break
            break
    estado["jogo_terminado"] = all(all(p == 0 for p in linha) for linha in estado["available_paus"])
    session["estado"] = estado
    return jsonify(success=True)

if __name__ == "__main__":
    app.run(debug=True)
