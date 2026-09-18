import os

def read_local_file(file_path: str) -> str:
    """Reads the contents of a local text file.
    
    Args:
        file_path: The absolute or relative path to the file you want to read.
        
    Returns:
        The text contents of the file, or an error message if it fails.
    """
    # 1. Check if the file actually exists
    if not os.path.exists(file_path):
        return f"Error: No file found at '{file_path}'."
        
    try:
        # 2. Safety check: Prevent reading massive files that destroy context windows
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        if file_size_mb > 0.5: # Half a megabyte is a safe upper limit for small models
            return f"Error: File is too large ({file_size_mb:.2f} MB). I can only read files up to 0.5 MB."

        # 3. Read the file
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
            
    except UnicodeDecodeError:
        # Happens if the model tries to read an image or compiled program
        return f"Error: '{file_path}' appears to be a binary file, not readable text."
    except PermissionError:
        return f"Error: I don't have permission to read '{file_path}'."
    except Exception as e:
        return f"Error reading file: {str(e)}"