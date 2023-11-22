from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pathlib import Path
from src.models import FastSAMModel, SAMModel
import torch

import uuid
import pickle

import matplotlib

matplotlib.use(
    "Agg"
)  # avoid using matplotlib in backend and getting tkinter excecptions

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = Path("./uploads")
RESULTS_FOLDER = Path("./results")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
FAST_SAM_WEIGHTS = "FastSAM-s.pt"
SAM_WEIGHTS = r"models\sam_vit_h_4b8939.pth"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

MODELS = {
    "fastsam": FastSAMModel(FAST_SAM_WEIGHTS),
    "sam": SAMModel(SAM_WEIGHTS),
    # Add other models here as you create implementations for them.
}

current_model = MODELS["sam"]


# Utility function to check allowed extensions
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/upload-image", methods=["POST"])
def upload_image():
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected for uploading"}), 400

    if file and allowed_file(file.filename):
        fileid = str(uuid.uuid4())
        filename = fileid + "." + file.filename.rsplit(".", 1)[1].lower()
        filepath = UPLOAD_FOLDER / filename
        file.save(filepath)

        # Process with FastSAM
        results = current_model.process_image(str(filepath), device=DEVICE)

        results_dir = RESULTS_FOLDER / fileid
        results_dir.mkdir(exist_ok=True)

        pkl_path = results_dir / "results.pkl"

        with pkl_path.open("wb") as f:
            pickle.dump(results, f)

        return (
            jsonify(
                {
                    "message": "File successfully uploaded and processed",
                    "filename": filename,
                }
            ),
            200,
        )
    else:
        return jsonify({"error": "Allowed file types are png, jpg, jpeg, gif"}), 400


@app.route("/prompt", methods=["POST"])
def prompt():
    data = request.json
    image_filename = data.get("filename")
    text = data.get("text")

    if not image_filename:
        return jsonify({"error": "Filename is required"}), 400

    image_id = image_filename.rsplit(".", 1)[0]
    image_path = UPLOAD_FOLDER / image_filename
    results_path = RESULTS_FOLDER / image_id / "results.pkl"

    with results_path.open("rb") as f:
        results = pickle.load(f)

    output_path = RESULTS_FOLDER / image_id / "output.jpg"
    current_model.process_text_prompt(
        str(image_path), results, text, device=DEVICE, output_path=output_path
    )

    return send_from_directory(
        RESULTS_FOLDER / image_id,
        "output.jpg",
        as_attachment=True,
        mimetype="image/jpeg",
    )

@app.route("/box-prompt", methods=["POST"])
def prompt_box():
    data = request.json
    image_filename = data.get("filename")
    
    if not image_filename:
        return jsonify({"error": "Filename is required"}), 400

    image_path = UPLOAD_FOLDER / image_filename
    image_id = image_filename.rsplit(".", 1)[0]
    output_path = RESULTS_FOLDER / image_id / "output.jpg"
    
    box = data.get("box")
    points = data.get("points")
    current_model.process_box_point_prompt(box,
                                        points,
                                        image_path=image_path,
                                        output_path=output_path)

    return send_from_directory(
        RESULTS_FOLDER / image_id,
        "output.jpg",
        as_attachment=True,
        mimetype="image/jpeg",
    )

    

if __name__ == "__main__":
    app.run(debug=True)
