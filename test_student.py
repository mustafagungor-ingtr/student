"""Tests for the Student Management System."""

import pytest
from student import StudentManager, print_student


@pytest.fixture
def manager():
    return StudentManager()


def test_add_student(manager):
    s = manager.add_student("Alice", 20, 85)
    assert s["name"] == "Alice"
    assert s["age"] == 20
    assert s["grade"] == 85


def test_add_student_invalid_name(manager):
    with pytest.raises(ValueError):
        manager.add_student("", 20, 85)


def test_add_student_invalid_age(manager):
    with pytest.raises(ValueError):
        manager.add_student("Bob", -1, 90)


def test_add_student_invalid_grade(manager):
    with pytest.raises(ValueError):
        manager.add_student("Bob", 20, 110)


def test_list_students_empty(manager):
    assert manager.list_students() == []


def test_list_students(manager):
    manager.add_student("Alice", 20, 85)
    manager.add_student("Bob", 22, 90)
    students = manager.list_students()
    assert len(students) == 2


def test_list_students_returns_copy(manager):
    manager.add_student("Alice", 20, 85)
    students = manager.list_students()
    students[0]["grade"] = 0  # mutate returned copy
    assert manager.find_student("Alice")["grade"] == 85  # original unchanged


def test_find_student(manager):
    manager.add_student("Alice", 20, 85)
    result = manager.find_student("alice")  # case-insensitive
    assert result is not None
    assert result["name"] == "Alice"


def test_find_student_not_found(manager):
    assert manager.find_student("Unknown") is None


def test_update_grade(manager):
    manager.add_student("Alice", 20, 85)
    updated = manager.update_grade("Alice", 95)
    assert updated["grade"] == 95


def test_update_grade_invalid(manager):
    manager.add_student("Alice", 20, 85)
    with pytest.raises(ValueError):
        manager.update_grade("Alice", 200)


def test_update_grade_not_found(manager):
    with pytest.raises(KeyError):
        manager.update_grade("Ghost", 70)


def test_print_student(capsys, manager):
    student = manager.add_student("Alice", 20, 85)
    print_student(student)
    captured = capsys.readouterr()
    assert "Alice" in captured.out
    assert "20" in captured.out
    assert "85" in captured.out


def test_remove_student(manager):
    manager.add_student("Alice", 20, 85)
    manager.remove_student("Alice")
    assert manager.find_student("Alice") is None


def test_remove_student_not_found(manager):
    with pytest.raises(KeyError):
        manager.remove_student("Nobody")
