"""Simple Student Management System."""

import copy


class StudentManager:
    """Manages a collection of students."""

    def __init__(self):
        self.students = []

    def add_student(self, name, age, grade):
        """Add a new student."""
        if not name or not isinstance(name, str):
            raise ValueError("Name must be a non-empty string.")
        if not isinstance(age, int) or age <= 0:
            raise ValueError("Age must be a positive integer.")
        if not isinstance(grade, (int, float)) or not (0 <= grade <= 100):
            raise ValueError("Grade must be a number between 0 and 100.")

        student = {"name": name.strip(), "age": age, "grade": grade}
        self.students.append(student)
        return student

    def list_students(self):
        """Return all students as deep copies to protect internal state."""
        return copy.deepcopy(self.students)

    def find_student(self, name):
        """Find a student by name (case-insensitive)."""
        name = name.strip().lower()
        for student in self.students:
            if student["name"].lower() == name:
                return student
        return None

    def update_grade(self, name, new_grade):
        """Update the grade of a student by name."""
        if not isinstance(new_grade, (int, float)) or not (0 <= new_grade <= 100):
            raise ValueError("Grade must be a number between 0 and 100.")
        student = self.find_student(name)
        if student is None:
            raise KeyError(f"Student '{name}' not found.")
        student["grade"] = new_grade
        return student

    def remove_student(self, name):
        """Remove a student by name."""
        student = self.find_student(name)
        if student is None:
            raise KeyError(f"Student '{name}' not found.")
        self.students.remove(student)
        return student


def print_student(student):
    print(f"  Name: {student['name']}, Age: {student['age']}, Grade: {student['grade']}")


def main():
    manager = StudentManager()
    print("=== Student Management System ===\n")

    while True:
        print("\nOptions:")
        print("  1. Add student")
        print("  2. List all students")
        print("  3. Find student")
        print("  4. Update grade")
        print("  5. Remove student")
        print("  6. Exit")

        choice = input("\nEnter choice: ").strip()

        if choice == "1":
            name = input("Name: ").strip()
            try:
                age = int(input("Age: ").strip())
                grade = float(input("Grade (0-100): ").strip())
                manager.add_student(name, age, grade)
                print(f"Student '{name}' added.")
            except ValueError as e:
                print(f"Error: {e}")

        elif choice == "2":
            students = manager.list_students()
            if not students:
                print("No students found.")
            else:
                for s in students:
                    print_student(s)

        elif choice == "3":
            name = input("Name to search: ").strip()
            student = manager.find_student(name)
            if student:
                print_student(student)
            else:
                print(f"Student '{name}' not found.")

        elif choice == "4":
            name = input("Name: ").strip()
            try:
                new_grade = float(input("New grade (0-100): ").strip())
                manager.update_grade(name, new_grade)
                print(f"Grade updated for '{name}'.")
            except (ValueError, KeyError) as e:
                print(f"Error: {e}")

        elif choice == "5":
            name = input("Name to remove: ").strip()
            try:
                manager.remove_student(name)
                print(f"Student '{name}' removed.")
            except KeyError as e:
                print(f"Error: {e}")

        elif choice == "6":
            print("Goodbye!")
            break

        else:
            print("Invalid choice. Please enter 1-6.")


if __name__ == "__main__":
    main()
