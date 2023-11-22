import numpy as np
import torch
from fastsam import FastSAM, FastSAMPrompt
from segment_anything import SamPredictor, sam_model_registry, SamAutomaticMaskGenerator
import cv2
import supervision as sv

def show_mask(image, mask):
    def random_color():
        return np.array([np.random.randint(0, 255) for _ in range(3)])
    
    # Convert the binary mask to a 3-channel image
    colored_mask = np.copy(image)
    colored_mask[mask > 0.5] = random_color() # Choose any color you like
    masked_image = cv2.addWeighted(image, 0.6, colored_mask, 0.4, 0)
        
    return masked_image

class SegmentationModel:
    def __init__(self, model_weights):
        self.model_weights = model_weights

    def process_image(self, image_path, **kwargs):
        raise NotImplementedError

    def process_text_prompt(self, image_path, results, text, **kwargs):
        raise NotImplementedError

class FastSAMModel(SegmentationModel):
    def __init__(self, model_weights):
        super().__init__(model_weights)
        self.model = FastSAM(model_weights)

    def process_image(self, image_path, **kwargs):
        return self.model(
            image_path,
            device=kwargs.get('device', "cuda"),
            retina_masks=True,
            imgsz=1024,
            conf=0.4,
            iou=0.9
        )

    def process_text_prompt(self, image_path, results, text, **kwargs):
        prompt_process = FastSAMPrompt(image_path, results, device=kwargs.get('device', "cuda"))
        ann = prompt_process.everything_prompt()
        ann = prompt_process.text_prompt(text=text)
        
        prompt_process.plot(
            annotations=ann,
            output_path=kwargs.get("output_path"),
            mask_random_color=True,
            better_quality=True,
            retina=False,
            withContours=True
        )
        
class SAMModel(SegmentationModel):
    def __init__(self, model_weights):
        super().__init__(model_weights)
        self.model = sam_model_registry["vit_h"](checkpoint=model_weights)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(device=device).eval()
        
        self.predictor = SamPredictor(self.model)
        self.annotator = sv.MaskAnnotator()

    def process_image(self, image_path, **kwargs):
        img_bgr = cv2.imread(image_path)
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        self.predictor.set_image(img_rgb)
        self.img_bgr = img_bgr

    def process_text_prompt(self, image_path, results, text, **kwargs):
        return
    
    def process_box_point_prompt(self, box=None, points=None, **kwargs):
        image_path = kwargs.get("image_path")
        output_path = kwargs.get("output_path")
        image_path = str(image_path)
        
        if box is not None:
            box = np.array(box)
        
        point_coords, point_labels = None, None
        if points["positive"] or points["negative"]:
            point_coords, point_labels = [], []
            
            print(points["positive"])
            print(points["negative"])
            
            for coords in points["positive"]:
                point_coords.append(coords)
                point_labels.append(1)
            
            for coords in points["negative"]:
                point_coords.append(coords)
                point_labels.append(0)
                
            point_coords = np.array(point_coords)
            point_labels = np.array(point_labels)
            
            print(point_coords)
            print(point_labels)
        
        masks, scores, logits = self.predictor.predict(
            box=box,
            point_coords=point_coords,
            point_labels=point_labels,
            multimask_output=False
        )
        
        for mask in masks:
            img_bgr = show_mask(self.img_bgr, mask)
        
        cv2.imwrite(str(output_path), img_bgr)