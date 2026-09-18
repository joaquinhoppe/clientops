import os
import ollama
from dotenv import load_dotenv

# Import tools

from tools.readfile import read_local_file

load_dotenv()
MODEL_NAME = os.getenv("OLLAMA_MODEL", "qwen3:4b")

my_tools = [
  read_local_file
]

tool_map = {func.__name__: func for func in my_tools}

def chat():
  print(f"Starting chat with {MODEL_NAME}... (Type 'exit' or 'quit' to close)")
  
  messages = []
  
  while True:
    try:
      user_prompt = input("\nYou: ")
      
      if user_prompt.lower() in ['quit', 'exit']:
        print("Goodbye!")
        break
        
      if not user_prompt.strip():
        continue
        
      messages.append({"role": "user", "content": user_prompt})
      
      response = ollama.chat(
        model=MODEL_NAME,
        messages=messages,
        tools=my_tools,
      )
      
      messages.append(response.message)

      if response.message.tool_calls:
        for tool_call in response.message.tool_calls:
          print(f"[System: Model is reading file via '{tool_call.function.name}'...]")
          
          func_to_execute = tool_map.get(tool_call.function.name)
          if func_to_execute:
            result = func_to_execute(**tool_call.function.arguments)

            messages.append({
                "role": "tool",
                "name": tool_call.function.name,
                "content": str(result)
            })

        final_response = ollama.chat(
          model=MODEL_NAME,
          messages=messages,
          tools=my_tools,
        )

        print(f"\nQwen: {final_response.message.content}")
        messages.append(final_response.message)

      else:
        print(f"\nQwen: {response.message.content}")

    except KeyboardInterrupt:
      print("\n[System: Chat forcefully closed.]")
      break

if __name__ == "__main__":
  chat()