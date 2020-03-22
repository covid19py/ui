from flask import Flask, request, render_template, send_from_directory, jsonify
from flask_pymongo import PyMongo, ASCENDING, DESCENDING

from flask_json_schema import JsonSchema

app = Flask(__name__, static_url_path='', template_folder='templates')

from os import environ
if 'MONGO_URI' in environ:
    app.config["MONGO_URI"] = environ['MONGO_URI']
else:
    app.config["MONGO_URI"] = "mongodb://localhost:27017/app"
mongo = PyMongo(app)

@app.route('/static/<path:path>')
def send_react_assets(path):
    return send_from_directory('build/static', path)

@app.route('/assets/<path:path>')
def send_assets(path):
    return send_from_directory('assets', path)

@app.route("/")
def home():
    return send_from_directory('build', 'index.html')

@app.route("/manifest.json")
def manifest():
    return send_from_directory('build', 'manifest.json')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory('build', 'favicon.ico')

@app.route('/', methods=['POST'])
def post():
    req_data = request.get_json()
    mongo.db.denuncias.insert_one(req_data)
    output = {}
    return jsonify(output)

@app.route("/reporte")
def reporte():
    return render_template('reporte.html')

@app.route("/reporte/denuncias")
def reporte_denuncias():
    objects = []
    for d in mongo.db.denuncias.find({}):
        ts = d['_id'].generation_time
        obj = {
            '_id': str(d['_id']),
            'coordenadas': d['coordenadas'],
            'canal': d['canal'],
            'tipo_denuncia': d['tipo_denuncia'],
            'denunciante': d['nombre'] + ' ' + d['apellido'],
            'observaciones': d['observaciones'],
            'creado': int(ts.timestamp()),
            'estado': d['estado']
        }
        objects.append(obj)
    return jsonify(objects)

if __name__ == '__main__':
    app.run(debug=True)
