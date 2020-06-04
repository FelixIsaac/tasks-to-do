import json
from mongoengine import connect

with open("config.json") as data:
    config = json.load(data)
    config = config[config["env"]]

connection = connect(host=config["database"])