# cdss_django/hospital_search/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class SearchLog(models.Model):
    api_name = models.CharField(max_length=100)
    search_query = models.CharField(max_length=200)
    result_count = models.IntegerField()
    search_date = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    def __str__(self):
        return f"{self.api_name} - {self.search_query} ({self.result_count}건)"
