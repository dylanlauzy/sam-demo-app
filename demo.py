from fastsam import FastSAM, FastSAMPrompt
import torch

DEVICE = "cuda"
IMAGE_PATH = "john.jpg"
MODEL_WEIGHTS = "FastSAM-x.pt"

model = FastSAM(MODEL_WEIGHTS)

results = model(IMAGE_PATH,
                device=DEVICE,
                retina_masks=True,
                imgsz=1024,
                conf=0.4,
                iou=0.9)

prompt_process = FastSAMPrompt(IMAGE_PATH, results, device=DEVICE)

ann = prompt_process.everything_prompt()
ann = prompt_process.text_prompt(text="Two wrestlers in an arena")

prompt_process.plot(
    annotations=ann,
    output_path=f"./output/{IMAGE_PATH}",
    mask_random_color=True,
    better_quality=True,
    retina=False,
    withContours=True
)