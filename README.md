# Face-Matcher

Class that enables facial matching between two faces
```javascript
import FaceMatcher from "./Match.js"

const path1 = "sample/image1.png"
const path2 = "sample/image2.png"
<!-- Path Can Be Of Type Buffer | String  -->
<!-- If path is string then it can local path to image or absolute url to image -->
const match = new FaceMatcher(path1, path2);
```
