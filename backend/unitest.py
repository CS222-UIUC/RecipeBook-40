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

if __name__ == "__main__":
    test_generate_recipe()
    test_read_recipe()

