# Unit tests

import requests
import json
test_recipe = {
        "name": "Test recipe",
        "recipe": {"Eggs": "2", "Flour": "2 cups", "Water": "3 cups", "Chicken": "150 g"}
    }
def test_generate_recipe():
    requests.post("http://localhost/recipe", data=json.dumps(test_recipe))
    return

def test_read_recipe():
    req = requests.get("http://localhost/recipe/1")
    data = json.loads(req.content)
    assert(data == test_recipe)

def test_add_recipe():
    # Now send the data?
    data = {
        "name": "Test recipe",
        "description": "test description",
        "steps": {"1": "test", "2": "test 2"},
        "ingredients": {"Eggs": "2", "Flour": "5 cups", "Water": "3 cups"},
        "is_personal": True,
        "users": [],
        "owner": "Test owner"
    }
    requests.post("http://localhost/add-recipe", data=data)

if __name__ == "__main__":
    test_generate_recipe()
    test_read_recipe()

