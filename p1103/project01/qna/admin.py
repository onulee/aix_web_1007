from django.contrib import admin
from .models import Question


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'title',
        'author',
        'created_at',
        'answer_status',
    )

    list_display_links = ('id', 'title')

    search_fields = ('title', 'author', 'content')

    readonly_fields = ('created_at',)

    def answer_status(self, obj):
        if obj.answer.strip():
            return '답변 완료'
        return '답변 대기'

    answer_status.short_description = '답변 상태'