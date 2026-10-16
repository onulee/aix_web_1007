from django.db import models

class Member(models.Model):
    id = models.CharField(max_length=30,primary_key=True)
    pw = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    nickname = models.CharField(max_length=100)
    tel = models.CharField(max_length=100,default='010-0000-0000')
    gender = models.CharField(max_length=100)
    hobby = models.CharField(max_length=100)
    mdate = models.DateTimeField(auto_now=True,blank=True)

    def __str__(self):
        return f'{self.id},{self.nickname},{self.mdate},'

    
