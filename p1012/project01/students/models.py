from django.db import models

class Students(models.Model):
    name = models.CharField(max_length=100)
    major = models.CharField(max_length=100)
    age = models.IntegerField(default=0)
    grade = models.IntegerField(default=0)
    gender = models.CharField(max_length=30)
    sdate = models.DateTimeField(auto_now=True,blank=True)

    def __str__(self):
        return f'{self.name},{self.major},{self.age},{self.grade},{self.gender}'
