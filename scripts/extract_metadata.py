#!/usr/bin/env python3
"""
Extract metadata from PNG files in the dictionary directory and save it to a JSON file.
This script should be run whenever new sequences are added to the dictionary.
"""

import os
import json
from PIL import Image
import argparse
from pathlib import Path


def extract_all_metadata(dictionary_dir, output_file, update_existing=True):
    """
    Extract metadata from all PNG files in the dictionary directory.

    Args:
        dictionary_dir: Path to the dictionary directory
        output_file: Path to the output JSON file
        update_existing: If True, update existing metadata file instead of creating a new one

    Returns:
        dict: Dictionary of metadata keyed by file path
    """
    # Load existing metadata if updating
    result = {}
    if update_existing and os.path.exists(output_file):
        try:
            with open(output_file, "r", encoding="utf-8") as f:
                result = json.load(f)
            print(
                f"Loaded existing metadata from {output_file} with {len(result)} entries"
            )
        except Exception as e:
            print(f"Error loading existing metadata: {e}")
            result = {}

    # Ensure the dictionary directory exists
    if not os.path.exists(dictionary_dir):
        print(f"Error: Directory {dictionary_dir} does not exist")
        return result

    # Walk through the directory and process PNG files
    for root, dirs, files in os.walk(dictionary_dir):
        for file in files:
            if file.endswith(".png"):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(
                    file_path, start=os.path.dirname(dictionary_dir)
                )
                web_path = f"/dictionary/{relative_path.replace(os.sep, '/')}"

                try:
                    with Image.open(file_path) as img:
                        metadata_str = img.info.get("metadata")
                        if metadata_str:
                            metadata = json.loads(metadata_str)
                            result[web_path] = metadata
                            print(f"Extracted metadata from {web_path}")
                        else:
                            print(f"No metadata found in {web_path}")
                except Exception as e:
                    print(f"Error processing {web_path}: {e}")

    # Save to a JSON file with proper Unicode handling
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"Metadata extracted from {len(result)} files and saved to {output_file}")
    return result


def main():
    parser = argparse.ArgumentParser(description="Extract metadata from PNG files")
    parser.add_argument(
        "--dictionary",
        default="static/dictionary",
        help="Path to the dictionary directory",
    )
    parser.add_argument(
        "--output",
        default="static/data/sequence_metadata.json",
        help="Path to the output JSON file",
    )
    parser.add_argument(
        "--force-new",
        action="store_true",
        help="Force creation of a new metadata file instead of updating existing",
    )
    parser.add_argument(
        "--specific-file",
        help="Process only a specific PNG file instead of the whole directory",
    )

    args = parser.parse_args()

    # Convert to absolute paths
    dictionary_dir = os.path.abspath(args.dictionary)
    output_file = os.path.abspath(args.output)

    if args.specific_file:
        # Process only a specific file
        specific_file = os.path.abspath(args.specific_file)
        if not os.path.exists(specific_file):
            print(f"Error: File {specific_file} does not exist")
            return

        if not specific_file.endswith(".png"):
            print(f"Error: File {specific_file} is not a PNG file")
            return

        # Load existing metadata
        result = {}
        if not args.force_new and os.path.exists(output_file):
            try:
                with open(output_file, "r", encoding="utf-8") as f:
                    result = json.load(f)
            except Exception as e:
                print(f"Error loading existing metadata: {e}")

        # Process the specific file
        try:
            with Image.open(specific_file) as img:
                metadata_str = img.info.get("metadata")
                if metadata_str:
                    metadata = json.loads(metadata_str)
                    relative_path = os.path.relpath(
                        specific_file, start=os.path.dirname(dictionary_dir)
                    )
                    web_path = f"/dictionary/{relative_path.replace(os.sep, '/')}"
                    result[web_path] = metadata
                    print(f"Extracted metadata from {web_path}")
                else:
                    print(f"No metadata found in {specific_file}")
        except Exception as e:
            print(f"Error processing {specific_file}: {e}")

        # Save the updated metadata
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        print(f"Metadata saved to {output_file}")
    else:
        # Process the entire directory
        extract_all_metadata(
            dictionary_dir, output_file, update_existing=not args.force_new
        )


if __name__ == "__main__":
    main()
