import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'

// Canvas
const canvas = document.querySelector('.webgl') as HTMLCanvasElement

// Scene
const scene = new THREE.Scene()

// Axes Helper
// const axesHelper = new THREE.AxesHelper(5)
// scene.add(axesHelper)

// Textures
const textureLoader = new THREE.TextureLoader()
const matcapTexture = textureLoader.load('textures/matcaps/4.png')

// Materials
const material = new THREE.MeshMatcapMaterial()
material.matcap = matcapTexture

// ^ Fonts
const fontLoader = new FontLoader()
fontLoader.load('fonts/helvetiker_regular.typeface.json', font => {
  console.log('font loaded')
  const textGeometry = new TextGeometry('Developed by Exclsv', {
    font,
    size: 0.5,
    depth: 0.1,
    curveSegments: 6,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 4,
  })

  // To get the bounding box of the text. So initially we don't have it.
  textGeometry.computeBoundingBox()

  if (textGeometry.boundingBox) {
    // 1st way
    // const centerOffset = new THREE.Vector3()

    /*
      The negate() method is used to invert the center coordinates, 
      which is equivalent to multiplying by -1 for centering.
    */
    // textGeometry.boundingBox.getCenter(centerOffset).negate()
    // textGeometry.translate(centerOffset.x, centerOffset.y, centerOffset.z)

    // 2nd way
    textGeometry.center()
  } else {
    console.warn('Unable to compute bounding box for text geometry')
  }

  const text = new THREE.Mesh(textGeometry, material)

  scene.add(text)
})

// Create a group for donuts
const donutGroup = new THREE.Group()
scene.add(donutGroup)

// Store initial scales - (for Audio reactive donuts)
const initialScales: THREE.Vector3[] = []

const donutGeometry = new THREE.TorusGeometry(0.3, 0.2, 20, 45)
for (let i = 0; i < 100; i++) {
  const donutMesh = new THREE.Mesh(donutGeometry, material)
  // Randomize the position of the donut
  donutMesh.position.x = (Math.random() - 0.5) * 10
  donutMesh.position.y = (Math.random() - 0.5) * 10
  donutMesh.position.z = (Math.random() - 0.5) * 10

  // Randomize the rotation of the donut
  donutMesh.rotation.x = Math.random() * Math.PI
  donutMesh.rotation.y = Math.random() * Math.PI

  // Randomize the scale of the donut
  const scale = Math.random() * 0.5
  donutMesh.scale.set(scale, scale, scale)
  initialScales.push(new THREE.Vector3(scale, scale, scale))

  // Add the donut to the group
  donutGroup.add(donutMesh)
}

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update aspect ratio
  camera.aspect = sizes.width / sizes.height

  camera.updateProjectionMatrix()

  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// * Camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
)

camera.position.z = 3.5
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.01

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// ^ Audio
const listener = new THREE.AudioListener()
camera.add(listener)

// create a global audio source
const sound = new THREE.Audio(listener)

// Create an AudioAnalyser
const analyser = new THREE.AudioAnalyser(sound, 32)

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader()
audioLoader.load('Teddy Swims The Door.mp3', buffer => {
  sound.setBuffer(buffer)
  sound.setLoop(true)
  sound.setVolume(0.4)
  sound.autoplay = true
  sound.play()
})

// Animate
// const clock = new THREE.Clock()

const animate = () => {
  // const elapsedTime = clock.getElapsedTime()

  // Update controls
  controls.update()

  // Get frequency data
  const frequencyData = analyser.getFrequencyData()

  // Animate donuts
  donutGroup.children.forEach((donut, index) => {
    donut.rotation.x += 0.01 * (index % 2 ? 1 : -1)
    donut.rotation.y += 0.01 * (index % 3 ? 1 : -1)

    // ^ Audio reactive donuts
    // Scale donuts based on frequency data and initial scale
    const frequencyIndex = index % frequencyData.length
    const scaleFactor = 1 + frequencyData[frequencyIndex] / 192 // Adjust divisor for desired effect

    const initialScale = initialScales[index]
    donut.scale.set(
      initialScale.x * scaleFactor,
      initialScale.y * scaleFactor,
      initialScale.z * scaleFactor
    )
  })

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(animate)
}

animate()
