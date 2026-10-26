from django.db import models

class Member(models.Model):
    # primaryKey : 중복불가, null불가
    # ForeignKey 외래키 : 다른클래스에서 primarykey로 사용된것을 사용할때
    id = models.CharField(max_length=30,primary_key=True)
    pw = models.CharField(max_length=100)
    name = models.CharField(max_length=60)
    nickname = models.CharField(max_length=60)
    tel = models.CharField(max_length=20) # 031-1203-1111
    gender = models.CharField(max_length=10) # 남자,여자
    hobby = models.CharField(max_length=100) # 게임,골프,수영,조깅,독서
    mdate = models.DateTimeField(auto_now=True,blank=True)

    def __str__(self):
        return f'{self.id},{self.name},{self.nickname},{self.hobby},{self.mdate}'

