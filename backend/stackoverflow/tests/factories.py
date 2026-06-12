import factory
from django.utils import timezone

from stackoverflow.models import StackQuestion, StackTag, StackUser


class StackUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = StackUser

    user_id = factory.Sequence(lambda n: n + 1)
    display_name = factory.Sequence(lambda n: f"User {n}")
    reputation = 100
    time_mined = factory.LazyFunction(timezone.now)


class StackTagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = StackTag

    name = factory.Sequence(lambda n: f"tag-{n}")


class StackQuestionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = StackQuestion

    question_id = factory.Sequence(lambda n: 100 + n)
    title = factory.Sequence(lambda n: f"Question {n}")
    owner = factory.SubFactory(StackUserFactory)
    score = 10
