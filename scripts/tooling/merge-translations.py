import json
import sys

def merge_json(file_path, new_content):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Merge new_content into data
        data.update(new_content)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Successfully updated {file_path}")
    except Exception as e:
        print(f"Error updating {file_path}: {e}")
        sys.exit(1)

# English
en_new = {
    "onboarding": {
        "title": "Welcome to ABDElevators",
        "description": "Let's set up your organization workspace in a few steps.",
        "steps": {
            "welcome": "Welcome",
            "identity": "Identity",
            "branding": "Branding",
            "storage": "Storage",
            "features": "Features",
            "billing": "Billing"
        },
        "actions": {
            "next": "Continue",
            "back": "Back",
            "finish": "Finish Setup",
            "skip": "Skip for now"
        }
    }
}
merge_json("messages/en/admin.json", en_new)

# Spanish
es_new = {
    "onboarding": {
        "title": "Bienvenido a ABDElevators",
        "description": "Vamos a configurar el espacio de trabajo de tu organización en pocos pasos.",
        "steps": {
            "welcome": "Bienvenida",
            "identity": "Identidad",
            "branding": "Branding",
            "storage": "Almacenamiento",
            "features": "Funcionalidades",
            "billing": "Facturación"
        },
        "actions": {
            "next": "Continuar",
            "back": "Atrás",
            "finish": "Finalizar Configuración",
            "skip": "Omitir por ahora"
        }
    }
}
merge_json("messages/es/admin.json", es_new)
