from django.db import models
from member.models import Member

class Board(models.Model):
    bno = models.AutoField(primary_key=True)
    # id = models.CharField(max_length=30)  # member -> primary_key
    member = models.ForeignKey(Member,on_delete=models.SET_NULL,blank=True,null=True)
    btitle = models.CharField(max_length=1000)
    bcontent = models.TextField()    # 대용량Text
    # 답변달기
    bgroup = models.IntegerField(default=0)
    bstep = models.IntegerField(default=0)
    bindent = models.IntegerField(default=0)
    bhit = models.IntegerField(default=1)
    bdate = models.DateTimeField(auto_now=True,blank=True)
    bfile = models.ImageField(blank=True,upload_to='board') #upload/board폴더를 생성하고 그안에 파일저장

    def __str__(self):
        return f'{self.bno},{self.btitle},{self.bdate}'

    # bno,id,btitle,bcontent,bgroup,bstep,bindent,bhit,bdate,bfile
    # bno : 게시판번호
    # id : 회원아이디
    # btitle:제목, bcontent:내용
    # bgroup-답변달기그룹핑,bstep-그룹핑순서,bindent-들여쓰기 : 답변달기
    # bhit : 조회수
    # bdate : 등록일
    # bfile : 파일첨부
