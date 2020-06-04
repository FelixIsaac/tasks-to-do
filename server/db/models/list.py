from mongoengine import *
from .task import Task


class List(Document):
    name = StringField(required=True, unique=True)
    description = StringField()
    icon = StringField()
    tasks = ListField(ReferenceField(Task))
