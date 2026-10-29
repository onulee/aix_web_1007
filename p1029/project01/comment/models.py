from django.db import models
from event.models import Event
from member.models import Member

class Comment(models.Model):
    cno = models.AutoField(primary_key=True)
    event = models.ForeignKey(Event,on_delete=models.CASCADE) #부모삭제시 모두삭제
    member = models.ForeignKey(Member,on_delete=models.SET_NULL,blank=True,null=True)
    cpw = models.CharField(max_length=10,blank=True,null=True)
    ccontent = models.TextField(blank=True)
    cdate = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.cno},{self.ccontent},{self.cdate}'