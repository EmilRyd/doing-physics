class ProjectileMotionSimulator {
    constructor() {
        this.canvas = document.getElementById('simulation-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Physics constants
        this.gravity = 7; // m/s²
        
        // Simulation state
        this.isRunning = false;
        this.animationId = null;
        this.startTime = 0;
        
        // Current parameters (match slider defaults)
        this.initialVelocity = 2.5; // m/s
        this.mass = 1; // kg (note: mass doesn't affect motion in vacuum)
        this.initialHeight = 2.5; // m
        
        // Current state
        this.currentTime = 0;
        this.currentHeight = 0;
        this.currentVelocity = 0;
        this.maxHeight = 0;
        this.flightTime = 0;
        
        // Visual scaling
        this.maxDisplayHeight = 25; // maximum height to display in meters
        this.pixelsPerMeter = 10; // will be calculated dynamically in calculateScaling()
        
        this.initializeElements();
        this.bindEvents();
        this.calculateScaling();
        
        // Now that scaling is calculated, position podium and ball correctly
        this.updatePodium();
        this.createBall();
        
        this.updateDisplay();
        this.generateHeightTicks();
    }
    
    initializeElements() {
        // Sliders
        this.velocitySlider = document.getElementById('initial-velocity');
        this.massSlider = document.getElementById('mass');
        this.heightSlider = document.getElementById('initial-height');
        
        // Value displays
        this.velocityValue = document.getElementById('velocity-value');
        this.massValue = document.getElementById('mass-value');
        this.heightValue = document.getElementById('height-value');
        
        // Buttons
        this.startBtn = document.getElementById('start-simulation');
        this.resetBtn = document.getElementById('reset-simulation');
        
        
        // Simulation area
        this.simulationArea = document.querySelector('.simulation-area');
    }
    
    bindEvents() {
        // Slider events
        this.velocitySlider.addEventListener('input', (e) => {
            this.initialVelocity = parseFloat(e.target.value);
            this.velocityValue.textContent = this.initialVelocity.toFixed(1);
            this.calculateMaxHeight();
            this.updateDisplay();
        });
        
        this.massSlider.addEventListener('input', (e) => {
            this.mass = parseFloat(e.target.value);
            this.massValue.textContent = this.mass.toFixed(1);
        });
        
        this.heightSlider.addEventListener('input', (e) => {
            this.initialHeight = parseFloat(e.target.value);
            this.heightValue.textContent = this.initialHeight.toFixed(1);
            this.calculateMaxHeight();
            
            
            this.updateDisplay();
            this.updatePodium();
            
            // Update ball position if it exists and simulation is not running
            if (!this.isRunning) {
                this.currentHeight = this.initialHeight;
                if (this.ball) {
                    this.positionBallOnPodium(this.initialHeight);
                } else {
                    this.createBall();
                }
            }
        });
        
        // Button events
        this.startBtn.addEventListener('click', () => this.startSimulation());
        this.resetBtn.addEventListener('click', () => this.resetSimulation());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.isRunning) {
                this.startSimulation();
            }
        });
        
        // Initialize podium and ball (will be positioned after scaling is calculated)
        this.createPodium();
        this.currentHeight = this.initialHeight;
    }
    
    calculateMaxHeight() {
        // Calculate maximum height using kinematic equation: h_max = h_0 + v_0²/(2g)
        this.maxHeight = this.initialHeight + (this.initialVelocity * this.initialVelocity) / (2 * this.gravity);
        
        // Calculate time to return to starting height (podium top): t = 2*v_0/g
        this.flightTime = this.initialVelocity > 0 ? (2 * this.initialVelocity) / this.gravity : 0;
    }
    
    calculateScaling() {
        // Calculate pixels per meter so that maxDisplayHeight fills the available space
        if (this.simulationArea) {
            const containerHeight = this.simulationArea.clientHeight;
            const groundHeight = 40;
            const availableHeight = containerHeight - groundHeight;
            this.pixelsPerMeter = availableHeight / this.maxDisplayHeight;
        }
    }
    
    generateHeightTicks() {
        const leftScale = document.querySelector('.left-scale');
        const rightScale = document.querySelector('.right-scale');
        
        if (!leftScale || !rightScale) {
            console.error('Height scale elements not found!');
            return;
        }
        
        // Clear existing ticks
        leftScale.innerHTML = '';
        rightScale.innerHTML = '';
        
        // Generate ticks every 1 meter (from 0 at ground up to maxDisplayHeight)
        for (let height = 0; height <= this.maxDisplayHeight; height += 1) {
            const leftTick = this.createHeightTick(height, 'left');
            const rightTick = this.createHeightTick(height, 'right');
            
            leftScale.appendChild(leftTick);
            rightScale.appendChild(rightTick);
        }
    }
    
    createHeightTick(height, side) {
        const tick = document.createElement('div');
        tick.className = 'height-tick';
        
        const label = document.createElement('span');
        label.className = 'height-label';
        label.textContent = `${height}m`;
        
        tick.appendChild(label);
        
        // Position the tick based on height relative to the full simulation area
        // Use the simulation area's clientHeight (canvas + ground) so 0m aligns with ground top
        const containerHeight = this.simulationArea.clientHeight;
        const groundHeight = 40;
        const tickPosition = containerHeight - groundHeight - (height * this.pixelsPerMeter);
        tick.style.position = 'absolute';
        tick.style.top = `${tickPosition}px`;
        tick.style.width = '100%';
        
        return tick;
    }
    
    createPodium() {
        this.podium = document.createElement('div');
        this.podium.className = 'podium';
        this.simulationArea.appendChild(this.podium);
    }
    
    updatePodium() {
        if (this.podium) {
            const podiumHeight = this.initialHeight * this.pixelsPerMeter;
            this.podium.style.height = `${podiumHeight}px`;
        }
    }
    
    createBall() {
        // Remove existing ball if any
        const existingBall = document.querySelector('.ball');
        if (existingBall) {
            existingBall.remove();
        }
        
        this.ball = document.createElement('div');
        this.ball.className = 'ball';
        this.simulationArea.appendChild(this.ball);
        
        // Position ball at starting position
        this.positionBallOnPodium(this.initialHeight);
    }
    
    positionBallByBottomHeight(height) {
        if (!this.ball) return;
        const containerHeight = this.simulationArea.clientHeight;
        const groundHeight = 40;
        const ballSize = 20;
        const areaWidth = this.simulationArea.clientWidth;
        const ballX = (areaWidth / 2) - (ballSize / 2);
        const ballY = (containerHeight - groundHeight) - (height * this.pixelsPerMeter) - ballSize;
        this.ball.style.left = `${ballX}px`;
        this.ball.style.top = `${ballY}px`;
    }

    positionBallOnPodium(height) {
        if (!this.ball) return;
        const containerHeight = this.simulationArea.clientHeight;
        const groundHeight = 40;
        const ballSize = 20;
        const areaWidth = this.simulationArea.clientWidth;
        let podiumTopY;
        if (this.podium && this.simulationArea) {
            const containerRect = this.simulationArea.getBoundingClientRect();
            const podiumRect = this.podium.getBoundingClientRect();
            podiumTopY = podiumRect.top - containerRect.top;
        } else {
            const podiumHeight = height * this.pixelsPerMeter;
            podiumTopY = (containerHeight - groundHeight) - podiumHeight;
        }
        const ballX = (areaWidth / 2) - (ballSize / 2);
        const ballY = podiumTopY - ballSize;
        this.ball.style.left = `${ballX}px`;
        this.ball.style.top = `${ballY}px`;
    }
    
    calculatePosition(time) {
        // Kinematic equation: h(t) = h_0 + v_0*t - (1/2)*g*t²
        const height = this.initialHeight + (this.initialVelocity * time) - (0.5 * this.gravity * time * time);
        
        // Velocity equation: v(t) = v_0 - g*t
        const velocity = this.initialVelocity - (this.gravity * time);
        
        return {
            height: Math.max(0, height), // Don't go below ground
            velocity: velocity
        };
    }
    
    startSimulation() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startTime = performance.now();
        this.currentTime = 0;
        
        this.calculateMaxHeight();
        this.createBall();
        
        this.startBtn.textContent = 'Run';
        this.startBtn.disabled = true;
        
        this.animate();
    }
    
    animate() {
        if (!this.isRunning) return;
        
        const now = performance.now();
        this.currentTime = (now - this.startTime) / 1000; // Convert to seconds
        
        const position = this.calculatePosition(this.currentTime);
        this.currentHeight = position.height;
        this.currentVelocity = position.velocity;
        
        
        // Update ball position (using physics height during simulation)
        this.positionBallByBottomHeight(this.currentHeight);
        
        // Update displays
        this.updateDisplay();
        
        // Check if simulation should end when the ball returns to podium height
        // End if time exceeded computed flight time or if height fell to/below initialHeight (with small tolerance)
        const epsilon = 0.01; // meters tolerance
        const timeEpsilon = 0.001; // seconds
        const returnedToStartHeight = (this.currentTime > timeEpsilon) && (this.currentHeight <= this.initialHeight + epsilon) && (this.currentVelocity <= 0);
        if (this.currentTime >= this.flightTime || returnedToStartHeight) {
            // Snap to podium height to avoid sinking
            this.currentHeight = this.initialHeight;
            this.positionBallByBottomHeight(this.currentHeight);
            this.endSimulation();
            return;
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    endSimulation() {
        this.isRunning = false;
        this.startBtn.textContent = 'Run';
        this.startBtn.disabled = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Position ball at ground level (resting position)
        this.positionBallOnPodium(0);
        this.currentHeight = 0;
        this.currentVelocity = 0;
        this.updateDisplay();
    }
    
    resetSimulation() {
        this.endSimulation();
        
        // Reset time and position
        this.currentTime = 0;
        this.currentHeight = this.initialHeight;
        this.currentVelocity = 0;
        
        // Reset ball position to current initial height (resting position)
        if (this.ball) {
            this.positionBallOnPodium(this.initialHeight);
        } else {
            this.createBall();
        }
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        // Display update method (currently no displays to update)
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight - 40; // Leave space for ground
        
        // Recalculate scaling for new dimensions
        this.calculateScaling();
        
        // Regenerate height ticks with new canvas dimensions
        this.generateHeightTicks();
        this.updatePodium();
        
        if (this.ball) {
            const usePhysics = this.isRunning;
            if (usePhysics) {
                this.positionBallByBottomHeight(this.currentHeight || this.initialHeight);
            } else {
                this.positionBallOnPodium(this.currentHeight || this.initialHeight);
            }
        }
    }
}

// Initialize the simulator when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const simulator = new ProjectileMotionSimulator();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        simulator.resizeCanvas();
    });
    
    // Initial canvas resize
    setTimeout(() => {
        simulator.resizeCanvas();
    }, 100);
});
