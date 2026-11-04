from django.db import models


class Question(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=50)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    # 관리자 답변
    answer = models.TextField(blank=True, default='')

    def __str__(self):
        return self.title
