import faceapi from "@vladmandic/face-api/dist/face-api.node.js";
import canvas from "canvas";
import path from "path";

type Image = string | Buffer;
type DetectType = "all" | "single";

const { Canvas, Image, ImageData, loadImage } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

class FaceMatcher {
  private photoA: string | Buffer;
  private photoB: string | Buffer;
  private detectTypeA: DetectType = "single";
  private detectTypeB?: DetectType = "all";

  constructor(
    photoA: string | Buffer,
    photoB: string | Buffer,
    detectTypeA: DetectType,
    detectTypeB?: DetectType
  ) {
    this.photoA = photoA;
    this.photoB = photoB;

    this.detectTypeA = detectTypeA;
    this.detectTypeB = detectTypeB;
  }

  async compare() {
    const [imageA, imageB] = await Promise.all([
      loadImage(this.photoA),
      loadImage(this.photoB),
    ]);

    const [resultA, resultB] = await Promise.all([
      this._detect(imageA, this.detectTypeA),
      this._detect(imageB, this.detectTypeB || this.detectTypeA),
    ]);

    const result = this._match(resultB, resultA);
    const { _label: label, distance } = result[0];

    return { distance, label };
  }

  private _detect(image: canvas.Image, detectType: DetectType) {
    if (detectType === "all")
      return faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();

    if (detectType === "single")
      return faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
  }

  private _match(compareThis: any, compareFrom: any) {
    const matcher = new faceapi.FaceMatcher(compareThis);
    return compareFrom.map((res) => matcher.findBestMatch(res.descriptor));
  }

  static modelspath = path.join(path.resolve(), "/models");
  static isModelLoaded = false;
  static SsdMobilenetv1Options = new faceapi.SsdMobilenetv1Options({
    minConfidence: 0.5,
  });

  static async loadModels() {
    if (FaceMatcher.isModelLoaded) return;

    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(FaceMatcher.modelspath),
      faceapi.nets.faceLandmark68Net.loadFromDisk(FaceMatcher.modelspath),
      faceapi.nets.faceRecognitionNet.loadFromDisk(FaceMatcher.modelspath),
    ]);

    FaceMatcher.isModelLoaded = true;
  }
}

FaceMatcher.loadModels();

export default FaceMatcher;
