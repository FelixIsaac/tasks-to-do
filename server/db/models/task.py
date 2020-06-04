from mongoengine import *


class Checklist(EmbeddedDocument):
    title = StringField(required=True)
    due = DateField()
    reminder = DateField()


class Task(Document):
    title = StringField(required=True, unique=True)
    description = StringField()
    attachments = ListField(StringField())
    checklist = EmbeddedDocumentListField(Checklist)
    reminder = DateField()
    cover = StringField()
    activity = ListField(StringField())
    listID = ObjectIdField(required=True)
