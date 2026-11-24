
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APITestCase

from notification.models import Notification

from .models import Question

User = get_user_model()
PASSWORD = "Pass12345!x"
QUESTIONS = "/api/community/questions/"


class CommunityRules(APITestCase):
    def setUp(self):
        cache.clear()
        self.asker = User.objects.create_user("asker", "a@example.com", PASSWORD, role="farmer")
        self.helper = User.objects.create_user("helper", "h@example.com", PASSWORD, role="expert")
        self.qid = self.ask()

    def ask(self):
        self.client.force_authenticate(self.asker)
        response = self.client.post(
            QUESTIONS,
            {"title": "How to water banana?", "body": "How often should I water banana plants?"},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        return response.data["id"]

    def answer(self):
        self.client.force_authenticate(self.helper)
        response = self.client.post(
            f"{QUESTIONS}{self.qid}/answers/", {"body": "Water twice a week."}, format="json"
        )
        self.assertEqual(response.status_code, 201, response.data)
        return response.data

    def test_anonymous_cannot_ask(self):
        self.client.force_authenticate(None)
        response = self.client.post(QUESTIONS, {"title": "x" * 6, "body": "y" * 6}, format="json")
        self.assertIn(response.status_code, (401, 403))

    def test_answer_notifies_asker(self):
        self.answer()
        self.assertEqual(Notification.objects.filter(user=self.asker).count(), 1)

    def test_only_asker_can_accept(self):
        answer_id = self.answer()["answers"][0]["id"]
        self.client.force_authenticate(self.helper)
        url = f"{QUESTIONS}{self.qid}/accept/"
        self.assertEqual(self.client.post(url, {"answer": answer_id}, format="json").status_code, 403)
        self.client.force_authenticate(self.asker)
        response = self.client.post(url, {"answer": answer_id}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["answers"][0]["is_accepted"])

    def test_expert_badge_needs_verification(self):
        data = self.answer()
        self.assertFalse(data["answers"][0]["is_expert"])
        self.helper.is_verified = True
        self.helper.save()
        self.client.force_authenticate(None)
        response = self.client.get(f"{QUESTIONS}{self.qid}/")
        self.assertTrue(response.data["answers"][0]["is_expert"])

    def test_hidden_question_not_listed(self):
        Question.objects.filter(pk=self.qid).update(is_hidden=True)
        self.client.force_authenticate(None)
        response = self.client.get(QUESTIONS)
        self.assertEqual(response.data["count"], 0)

    def test_cannot_report_own_question(self):
        self.client.force_authenticate(self.asker)
        response = self.client.post(
            f"{QUESTIONS}{self.qid}/report/", {"reason": "just testing"}, format="json"
        )
        self.assertEqual(response.status_code, 400)
