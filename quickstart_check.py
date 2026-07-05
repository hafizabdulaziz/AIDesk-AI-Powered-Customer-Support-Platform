from calculator_project.calculator import Calculator

def main():
    calc = Calculator()

    # Addition
    result = calc.add(10, 5)
    print(f"10 + 5 = {result}")
    assert result == 15.0

    # Division
    try:
        result = calc.divide(10, 0)
    except ValueError as e:
        print(f"Error: {e}")
        assert str(e) == "Cannot divide by zero"

    print("Quickstart validation successful!")

if __name__ == "__main__":
    main()
