// ----------------------------------------------------------------
// Class to contain simulation
// ----------------------------------------------------------------

class Simulation {
  constructor() {
    this.ui = new UI();
    this.status = 'setting';
    this.gravitationalConstant = 1;
    this.planets = [];
    this.canvasChanged = true;
    this.cameraZoom = 100;
    this.cameraPos = createVector();
    this.maxPathIterations = 800;
  }

  mainLoop() {
    this.gravitationalConstant = Number(this.ui.infoContainerBody.getElementsByTagName('INPUT')[0].value);

    if (this.status == 'setting') {
      for (var planet of this.planets) {
        planet.getInfoFromHTML();
        planet.path.getInfoFromHTML();
      }

      this.drawPaths();

    } else if (this.status == 'running') {
      this.movePlanets();
    }

    this.drawPlanets();
  }

  drawPaths() {
    for (var planet of this.planets) {
      for (var i = 0; i < this.maxPathIterations; i++) {
        var inBounds = planet.path.move();
        planet.path.draw(i / this.maxPathIterations);

        if (!inBounds) {break;}
      }
    }
  }

  movePlanets() {
    for (var planet of this.planets) {
      planet.move();
    }
  }

  drawPlanets() {
    for (var planet of this.planets) {
      planet.draw();
    }
  }

  addPlanet() {
    var planetInfo = this.ui.addPlanetInfo();
    this.planets.push(new Planet(planetInfo));
    this.canvasChanged = true;
  }

  togglePlayPause() {
    if (this.status == 'setting' || this.status == 'paused') {
      this.status = 'running';
    } else {
      this.status = 'paused';
    }

    this.ui.setPlayPauseIcon(this.status);
  }

  restart() {
    this.status = 'setting';
    this.ui.setPlayPauseIcon(this.status);
    this.canvasChanged = true;
  }

  deletePlanet(planetHTMLNode) {
    let planet = this.getPlanetByHTML(planetHTMLNode);
    simulation.planets.splice(simulation.planets.indexOf(planet), 1);

    simulation.ui.infoContainerBody.removeChild(planetHTMLNode);
    this.canvasChanged = true;
  }

  getPlanetByHTML(planetHTMLNode) {
    for (let planet of this.planets) {
      if (planet.planetInfo == planetHTMLNode) {
        return planet
      }
    }
  }

  drawGrid() {
    stroke(255, 50);
    var xMin = -Math.floor(cameraPos.x / cameraZoom) * cameraZoom - width / 2 - cameraZoom;
    var xMiddle = -Math.floor(cameraPos.x / cameraZoom) * cameraZoom;
    var xMax = -Math.floor(cameraPos.x / cameraZoom) * cameraZoom + width / 2;

    var yMin = -Math.floor(cameraPos.y / cameraZoom) * cameraZoom - height / 2 - cameraZoom;
    var yMiddle = -Math.floor(cameraPos.y / cameraZoom) * cameraZoom;
    var yMax = -Math.floor(cameraPos.y / cameraZoom) * cameraZoom + height / 2;

    var step = cameraZoom * 2;

    for (var i = xMiddle - step; i >= xMin; i -= step) {
      line(cameraPos.x + i, -height / 2, cameraPos.x + i, height / 2);
    }

    for (var i = xMiddle; i <= xMax; i += step) {
      line(cameraPos.x + i, -height / 2, cameraPos.x + i, height / 2);
    }

    for (var i = yMiddle - step; i >= yMin; i -= step) {
      line(-width / 2, cameraPos.y + i, width / 2, cameraPos.y + i);
    }

    for (var i = yMiddle; i <= yMax; i += step) {
      line(-width / 2, cameraPos.y + i, width / 2, cameraPos.y + i);
    }

    noStroke();
  }
}

// ----------------------------------------------------------------
// Class to hold UI elements
// ----------------------------------------------------------------

class UI {
  constructor() {
    this.infoContainer = document.getElementById('info-container');
    this.infoContainerHeader = document.getElementsByClassName('info-container-header')[0];
    this.infoContainerFooter = document.getElementsByClassName('info-container-footer')[0];
    this.buttons = this.infoContainerHeader.getElementsByTagName('button');
    this.openInfoContainer = document.getElementsByClassName('open-info-container')[0];
    this.infoContainerBody = document.getElementById('info-container-body');
    this.examplePlanetInfo = document.getElementById('example-planet');
    this.uniquePlanetId = 0;
    this.infoContainerMoving = false;

    this.infoContainer.addEventListener('transitionstart', function() {
      this.infoContainerMoving = true;
    });

    this.infoContainer.addEventListener('transitionend', function() {
      this.infoContainerMoving = false;
      screenResized();
    });
    
    this.inputUpdated(this.infoContainerFooter.getElementsByTagName("INPUT")[0]);
  }

  toggleInfoContainer() {
    if (this.infoContainerOpen()) {
      this.infoContainer.classList.remove('visible');
      this.infoContainer.classList.add('hidden');

    } else {
      this.infoContainer.classList.remove('hidden');
      this.infoContainer.classList.add('visible');
    }
  }

  infoContainerOpen() {
    return this.infoContainer.classList.contains('visible');
  }

  setPlayPauseIcon(state) {
    var playPauseButton = this.buttons[2].children[0];

    if (state == 'running') {
      playPauseButton.classList.remove('fa-play-circle');
      playPauseButton.classList.add('fa-pause-circle');
    } else {
      playPauseButton.classList.remove('fa-pause-circle');
      playPauseButton.classList.add('fa-play-circle');
    }
  }

  addPlanetInfo() {
    var newPlanetInfo = this.examplePlanetInfo.cloneNode(true);
    newPlanetInfo.id = 'planet-' + this.uniquePlanetId;
    this.uniquePlanetId++;

    newPlanetInfo.style.display = 'block';

    for (var input of newPlanetInfo.getElementsByTagName('input')) {
      this.inputUpdated(input);
    }

    this.infoContainerBody.appendChild(newPlanetInfo);

    return newPlanetInfo;
  }

  inputUpdated(input) {
    var maxWidth = input.getAttribute('custom-max-width');
    input.style.width = 'max(1ch, min(' + input.value.length + 'ch,' + maxWidth + '))';

    if (input.classList.contains('planet-color')) {
      input.style.backgroundColor = '#' + input.value;

      var bgColor = color('#' + input.value);

      if (brightness(bgColor) > 50) {
        input.style.color = '#000';
      } else {
        input.style.color = '#fff';
      }
    }
  }
}


class Mover {
  constructor(planetInfo) {
    this.pos = createVector();
    this.vel = createVector();
    this.mass = 1;
    this.radius = 1;
    this.color = color('#f00');
    this.planetInfo = planetInfo;
  }

  getInfoFromHTML() {
    this.pos.x = Number(this.planetInfo.getElementsByTagName('input')[1].value);
    this.pos.y = Number(this.planetInfo.getElementsByTagName('input')[2].value);

    this.vel.x = Number(this.planetInfo.getElementsByTagName('input')[3].value);
    this.vel.y = Number(this.planetInfo.getElementsByTagName('input')[4].value);

    this.mass = Number(this.planetInfo.getElementsByTagName('input')[5].value);
    this.radius = Number(this.planetInfo.getElementsByTagName('input')[6].value);
    this.color = color("#" + this.planetInfo.getElementsByTagName('input')[7].value);
  }

  move() {
    var netForce = createVector();

    for (var other of this.getMoverPartners()) {
      if (other != this) {
        netForce.add(this.getForce(other))
      }
    }

    var acc = netForce.div(this.mass);
    this.vel.add(acc);
    this.pos.add(this.vel);
  }

  getForce(other) {
    var forceMag =  (simulation.gravitationalConstant * this.mass * other.mass) /
                    (Math.pow(this.pos.dist(other.pos) * 1000, 2));


    var forceDir = p5.Vector.sub(other.pos, this.pos).normalize();

    var force = forceDir.mult(forceMag);

    return force;
  }
}
// ----------------------------------------------------------------
// Class to represent a Planet
// ----------------------------------------------------------------

class Planet extends Mover {
  constructor(planetInfo) {
    super(planetInfo);
    this.path = new PlanetPath(planetInfo);
  }

  getMoverPartners() {
    return simulation.planets;
  }

  draw() {
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.radius);
  }
}


class PlanetPath extends Mover {
  constructor(planetInfo) {
    super(planetInfo);
    this.prevPos = createVector();
    this.hasBeenInBounds = false;
  }

  getMoverPartners() {
    var moverPartners = [];
    for (var planet of simulation.planets) {
      moverPartners.push(planet.path);
    }

    return moverPartners;
  }

  move() {
    this.prevPos = this.pos.copy();
    super.move();

    var bounds = [createVector((-width/2 - simulation.cameraPos.x) / simulation.cameraZoom,
      (-height/2 - simulation.cameraPos.y) / simulation.cameraZoom),
      createVector((width/2 - simulation.cameraPos.x) / simulation.cameraZoom,
      (height/2 - simulation.cameraPos.y) / simulation.cameraZoom)]

    var inBoundsX = bounds[0].x < this.pos.x && this.pos.x < bounds[1].x;
    var inBoundsY = bounds[0].y < this.pos.y && this.pos.y < bounds[1].y;

    if (this.inBoundsX && this.inBoundsY) {
      this.hasBeenInBounds = true;
    }

    var notMoving = this.pos.equals(this.prevPos);

    var traveledOffScreen = (!inBoundsX || !inBoundsY) && this.hasBeenInBounds;

    return !traveledOffScreen && !notMoving;
  }

  draw(percentComplete) {
    stroke(red(this.color), green(this.color), blue(this.color), 255 - 255 * percentComplete);
    strokeWeight(2/simulation.cameraZoom);

    line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y);

    noStroke();
  }
}


// ----------------------------------------------------------------
// p5js buitin functions
// ----------------------------------------------------------------

var simulation;

function setup() {
  simulation = new Simulation();
  canvas = createCanvas(windowWidth - simulation.ui.infoContainer.offsetWidth, windowHeight);
  noStroke();
}

function draw() {
  if (simulation.ui.infoContainerMoving) {
    resizeCanvas(windowWidth - simulation.ui.infoContainer.offsetWidth -
      simulation.ui.infoContainer.offsetLeft - 1, windowHeight);

    simulation.canvasChanged = true;
  }

  if (!(simulation.canvasChanged || simulation.status == 'running')) {
    return;
  }

  background(0);

  // Place 0, 0 in center
  translate(width / 2, height / 2)
  scale(1, -1);

  // Translate and scale by user values
  translate(simulation.cameraPos.x, simulation.cameraPos.y);
  scale(simulation.cameraZoom);

  simulation.mainLoop();

  simulation.canvasChanged = false;
}

// Functions to resize canvas when screen size changes or info container
// is shown/hidden
function screenResized() {
  resizeCanvas(windowWidth - simulation.ui.infoContainer.offsetWidth -
    simulation.ui.infoContainer.offsetLeft, windowHeight);

  simulation.canvasChanged = true;
}

// Function to identify when to change width of focused input
function keyPressed() {
  var activeInput = document.activeElement || document.querySelector(':focus');

  if (activeInput.tagName.toUpperCase() == 'INPUT') {
    if (simulation.status == 'running') {
      simulation.togglePlayPause();
    }

    simulation.status = 'setting';
    simulation.canvasChanged = true;

    setTimeout(function() {
      simulation.ui.inputUpdated(activeInput);
    }, 1);
  }
}

function mouseDragged() {
  if (event.target.tagName && event.target.tagName.toUpperCase() == 'CANVAS') {
    simulation.cameraPos.add(movedX, -movedY);
    simulation.canvasChanged = true;
  }
}

function mouseWheel(event) {
  if (event.target.tagName.toUpperCase() == 'CANVAS') {
    if (event.deltaMode == 1) {
      simulation.cameraZoom *= (1 - event.delta / 50);
    } else {
      simulation.cameraZoom *= (1 - event.delta / 1000);
    }

  }

  simulation.canvasChanged = true;
}
