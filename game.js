let gameInstance = null;
let planeInstance = null;

class PlaneAnimation {
    constructor() {
        this.canvas = document.getElementById('planeCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = 100;
        
        this.plane = {
            x: -200,
            y: -70,
            width: 350,
            height: 200,
            speed: 3,
            lastAppearance: 0,
            isVisible: false
        };
        
        this.planeImage = new Image();
        this.planeImage.src = 'img/avion.png';
        
        this.animate();
    }
    
    update() {
        const currentTime = Date.now();
        
        if (!this.plane.isVisible && currentTime - this.plane.lastAppearance > 10000) {
            this.plane.isVisible = true;
            this.plane.x = -200;
            this.plane.lastAppearance = currentTime;
        }
        
        if (this.plane.isVisible) {
            this.plane.x += this.plane.speed;
            if (this.plane.x > this.canvas.width + 200) {
                this.plane.isVisible = false;
            }
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.plane.isVisible && this.planeImage.complete) {
            this.ctx.drawImage(this.planeImage, this.plane.x, this.plane.y, 
            this.plane.width, this.plane.height);
        }
    }
    
    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = 400;
        
        this.score = 0;
        this.timeLeft = 60;
        this.plasticBags = [];
        this.isGameOver = false;
        
        // Chargement de l'image de fond
        this.background = new Image();
        this.background.src = 'img/background.png';
        this.background.onload = () => console.log('Background loaded');
        
        // Chargement des images des sacs
        this.bagImages = [
            { img: new Image(), src: 'img/sacs_1.png' },
            { img: new Image(), src: 'img/sacs_4.png' },
            { img: new Image(), src: 'img/sacs_5.png' }
        ];
        
        this.bagImages.forEach(bag => {
            bag.img.src = bag.src;
            bag.img.onload = () => console.log(`Sac chargé: ${bag.src}`);
        });
        
        // Ajout des sons
        this.bagSound = new Audio('audio/sac.mp3');
        this.backgroundMusic = new Audio('audio/audio.mp3');
        this.backgroundMusic.loop = true; // La musique se répète
        
        // Ne pas démarrer automatiquement
        this.setupGame();
    }

    setupGame() {
        this.bindEvents();
    }

    startGame() {
        document.getElementById('start-menu').style.display = 'none';
        
        // Démarrer la musique
        this.backgroundMusic.play().catch(error => {
            console.log("Erreur lecture audio:", error);
        });
        
        // Démarrer le jeu
        this.startTimer();
        this.generatePlasticBags();
        this.gameLoop();
    }

    bindEvents() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        document.getElementById('save-score').addEventListener('click', () => this.saveScore());
        document.getElementById('restart').addEventListener('click', () => this.restart());
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.plasticBags = this.plasticBags.filter((bag) => {
            if (this.isClickedOnBag(x, y, bag)) {
                this.score += 10;
                document.getElementById('score-value').textContent = this.score;
                // Jouer le son du sac
                this.bagSound.currentTime = 0; // Réinitialiser le son
                this.bagSound.play();
                return false;
            }
            return true;
        });
    }

    isClickedOnBag(x, y, bag) {
        return x > bag.x && x < bag.x + bag.width && 
               y > bag.y && y < bag.y + bag.height;
    }

    generatePlasticBags() {
        if (this.plasticBags.length === 0 && !this.isGameOver) {
            const randomBagImage = this.bagImages[Math.floor(Math.random() * this.bagImages.length)].img;
            
            // Zone de spawn sur le sable
            const minY = this.canvas.height * 0.5;
            const maxY = this.canvas.height - 70;
            
            const bag = {
                x: Math.random() * (this.canvas.width - 50),
                y: minY + Math.random() * (maxY - minY),
                width: 50,
                height: 50,
                image: randomBagImage
            };
            this.plasticBags.push(bag);
        }
        setTimeout(() => this.generatePlasticBags(), 1000);
    }

    startTimer() {
        const timerInterval = setInterval(() => {
            this.timeLeft--;
            document.getElementById('timer-value').textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                clearInterval(timerInterval);
                this.endGame();
            }
        }, 1000);
    }

    endGame() {
        this.isGameOver = true;
        // Arrêter la musique de fond
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
        
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('final-score').textContent = this.score;
        this.loadLeaderboard();
    }

    saveScore() {
        const playerName = document.getElementById('player-name').value;
        if (!playerName) return;

        const scoreData = {
            name: playerName,
            score: this.score,
            date: new Date().toISOString()
        };

        let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        leaderboard.push(scoreData);
        leaderboard.sort((a, b) => b.score - a.score);
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
        
        this.loadLeaderboard();
    }

    loadLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '';
        
        leaderboard.slice(0, 5).forEach((entry, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${entry.name}: ${entry.score} points`;
            leaderboardList.appendChild(li);
        });
    }

    restart() {
        window.location.reload();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dessiner le fond
        if (this.background.complete) {
            this.ctx.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Dessiner les sacs plastiques
        this.plasticBags.forEach(bag => {
            if (bag.image.complete) {
                this.ctx.drawImage(bag.image, bag.x, bag.y, bag.width, bag.height);
            }
        });
    }

    gameLoop() {
        if (!this.isGameOver) {
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

window.onload = () => {
    gameInstance = new Game();
    planeInstance = new PlaneAnimation();
    
    // Ajouter l'événement pour démarrer le jeu
    document.getElementById('start-button').addEventListener('click', () => {
        gameInstance.startGame();
    });
}; 

document.getElementById('save-score').addEventListener('click', () => {
    const impactScreen = document.getElementById('impact-screen');
    if (!impactScreen) {
        console.error("L'élément #impact-screen est introuvable !");
        return;
    }

    gameInstance.saveScore();
    const playerName = document.getElementById('player-name').value;
    if (!playerName) return;

    const score = gameInstance.score;
    const weightPerBag = 0.05; // 50g de plastique par sac
    const totalPlastic = score * weightPerBag; // en kg
    const savedFish = Math.floor(totalPlastic * 2); // estimation
    const savedWhales = Math.floor(totalPlastic / 100); // estimation

    document.getElementById('final-score').textContent = score;
    document.getElementById('plastic-weight').textContent = totalPlastic.toFixed(2);
    document.getElementById('saved-fish').textContent = savedFish;
    document.getElementById('saved-whales').textContent = savedWhales;

    document.getElementById('game-over').classList.add('hidden');
    impactScreen.classList.remove('hidden');

    impactScreen.style.display = 'flex';
    impactScreen.style.position = 'fixed';
    impactScreen.style.top = '0';
    impactScreen.style.left = '0';
    impactScreen.style.width = '100vw';
    impactScreen.style.height = '100vh';
    impactScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    impactScreen.style.justifyContent = 'center';
    impactScreen.style.alignItems = 'center';
    impactScreen.style.flexDirection = 'column';
    impactScreen.style.zIndex = '1000';
    impactScreen.style.color = 'white';

    animateImpactScreen();
});

function animateImpactScreen() {
    const impactSection = document.getElementById('impact-screen');
    let scrollY = 0;
    const interval = setInterval(() => {
        scrollY += 2;
        impactSection.scrollTop = scrollY;
        if (scrollY >= impactSection.scrollHeight - impactSection.clientHeight) {
            clearInterval(interval);
        }
    }, 50);
}

document.getElementById('restart-impact').addEventListener('click', () => {
    window.location.reload();
});


function drawGlowEffect(bag) {
    const glowSize = 10;
    const gradient = gameInstance.ctx.createRadialGradient(
        bag.x + bag.width / 2, 
        bag.y + bag.height / 2, 
        bag.width / 2, 
        bag.x + bag.width / 2, 
        bag.y + bag.height / 2, 
        bag.width / 2 + glowSize
    );
    gradient.addColorStop(0, 'rgba(255, 165, 0, 0.5)'); // jaune orange
    gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
    
    gameInstance.ctx.fillStyle = gradient;
    gameInstance.ctx.fillRect(bag.x - glowSize, bag.y - glowSize, bag.width + glowSize * 2, bag.height + glowSize * 2);
}

Game.prototype.draw = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Dessiner le fond
    if (this.background.complete) {
        this.ctx.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Dessiner les sacs plastiques avec effet glow
    this.plasticBags.forEach(bag => {
        if (bag.image.complete) {
            drawGlowEffect(bag);
            this.ctx.drawImage(bag.image, bag.x, bag.y, bag.width, bag.height);
        }
    });
};




