from db.database import connection
from flask import Flask
app = Flask(__name__)

print('Connected to database', connection)


@app.route('/')
def func():
    return 'WOOW'
