import React, { useState, useEffect, useCallback } from 'react';

const GRAVITY = 0.6;
const JUMP_STRENGTH = -10;
const PIPE_WIDTH = 80;
const PIPE_GAP = 200;
const PIPE_SPEED = 3;
const BIRD_WIDTH = 40;
const BIRD_HEIGHT = 30;
const MIN_PIPE_HEIGHT = 50;
const PIPE_SPACING = 300;
const POWER_UP_CHANCE = 0.1; // 10% chance of power-up spawning
const POWER_UP_DURATION = 5000; // 5 seconds

const titles = [
  { score: 0, title: "Egg Dweller" },
  { score: 10, title: "Hatchling" },
  { score: 20, title: "Backyard Explorer" },
  { score: 30, title: "Local Celebrity" },
  { score: 40, title: "Town Favorite" },
  { score: 50, title: "Regional Hero" },
  { score: 60, title: "National Idol" },
  { score: 70, title: "World Superstar" },
  { score: 80, title: "Legendary Aviator" },
  { score: 90, title: "Cosmic Chicken" },
  { score: 100, title: "Guardian of the Galaxy" }
];

const themes = [
  { name: "Classic", bird: "🐓", background: "linear-gradient(180deg, #4dc9ff 0%, #74e7ff 100%)", pipeColor: "#43a047" },
  { name: "Space", bird: "🚀", background: "linear-gradient(180deg, #000000 0%, #434343 100%)", pipeColor: "#c0c0c0" },
  { name: "Underwater", bird: "🐠", background: "linear-gradient(180deg, #0077be 0%, #00a9ff 100%)", pipeColor: "#008080" },
];

const getTitle = (score) => {
  for (let i = titles.length - 1; i >= 0; i--) {
    if (score >= titles[i].score) {
      return titles[i].title;
    }
  }
  return titles[0].title;
};

const FlappyChicken = () => {
  const [gameSize, setGameSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [birdPosition, setBirdPosition] = useState(gameSize.height / 2);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [birdRotation, setBirdRotation] = useState(0);
  const [pipes, setPipes] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(themes[0]);
  const [powerUp, setPowerUp] = useState(null);
  const [isPoweredUp, setIsPoweredUp] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setGameSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const generatePipe = useCallback((xPosition) => {
    const maxPipeHeight = gameSize.height - PIPE_GAP - MIN_PIPE_HEIGHT;
    const height = Math.random() * (maxPipeHeight - MIN_PIPE_HEIGHT) + MIN_PIPE_HEIGHT;
    const hasPowerUp = Math.random() < POWER_UP_CHANCE;
    return { x: xPosition, height: height, hasPowerUp };
  }, [gameSize.height]);

  const initializePipes = useCallback(() => {
    const initialPipes = [];
    for (let i = 0; i < 3; i++) {
      initialPipes.push(generatePipe(gameSize.width + i * PIPE_SPACING));
    }
    return initialPipes;
  }, [gameSize.width, generatePipe]);

  const jump = useCallback(() => {
    if (!gameStarted) {
      setGameStarted(true);
      setPipes(initializePipes());
    }
    if (!gameOver) {
      setBirdVelocity(JUMP_STRENGTH);
      setBirdRotation(-45);
    }
  }, [gameStarted, gameOver, initializePipes]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        jump();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('touchstart', jump);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('touchstart', jump);
    };
  }, [jump]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const gameLoop = setInterval(() => {
        setBirdPosition((prevPosition) => {
          const newPosition = prevPosition + birdVelocity;
          if (newPosition > gameSize.height - BIRD_HEIGHT || newPosition < 0) {
            setGameOver(true);
            return prevPosition;
          }
          return newPosition;
        });
        
        setBirdVelocity((prevVelocity) => prevVelocity + GRAVITY);
        
        setBirdRotation((prevRotation) => {
          if (prevRotation < 90) {
            return prevRotation + 4;
          }
          return 90;
        });
        
        setPipes((prevPipes) => {
          const newPipes = prevPipes.map((pipe) => ({
            ...pipe,
            x: pipe.x - PIPE_SPEED,
          })).filter((pipe) => pipe.x > -PIPE_WIDTH);
          
          if (newPipes.length < 3) {
            const lastPipe = newPipes[newPipes.length - 1];
            newPipes.push(generatePipe(lastPipe.x + PIPE_SPACING));
          }
          
          return newPipes;
        });
        
        setScore((prevScore) => {
          const passedPipe = pipes.find((pipe) => pipe.x + PIPE_WIDTH <= gameSize.width / 2 && pipe.x + PIPE_WIDTH > gameSize.width / 2 - PIPE_SPEED);
          return passedPipe ? prevScore + 1 : prevScore;
        });
        
        // Collision detection and power-up collection
        pipes.forEach((pipe) => {
          if (
            !isPoweredUp &&
            (birdPosition < pipe.height || birdPosition + BIRD_HEIGHT > pipe.height + PIPE_GAP) &&
            pipe.x < gameSize.width / 2 + BIRD_WIDTH / 2 && pipe.x + PIPE_WIDTH > gameSize.width / 2 - BIRD_WIDTH / 2
          ) {
            setGameOver(true);
          }

          if (
            pipe.hasPowerUp &&
            birdPosition > pipe.height &&
            birdPosition < pipe.height + PIPE_GAP &&
            pipe.x < gameSize.width / 2 + BIRD_WIDTH / 2 && pipe.x + PIPE_WIDTH > gameSize.width / 2 - BIRD_WIDTH / 2
          ) {
            setPowerUp("invincibility");
            setIsPoweredUp(true);
            setTimeout(() => {
              setIsPoweredUp(false);
              setPowerUp(null);
            }, POWER_UP_DURATION);
          }
        });
      }, 20);
      
      return () => clearInterval(gameLoop);
    }
  }, [gameStarted, gameOver, birdPosition, birdVelocity, pipes, gameSize, generatePipe, isPoweredUp]);

  const restartGame = () => {
    setBirdPosition(gameSize.height / 2);
    setBirdVelocity(0);
    setBirdRotation(0);
    setPipes([]);
    setGameStarted(false);
    setScore(0);
    setGameOver(false);
    setPowerUp(null);
    setIsPoweredUp(false);
  };

  const changeTheme = (theme) => {
    setCurrentTheme(theme);
  };

  return (
    <div 
      className="relative overflow-hidden w-screen h-screen"
      onClick={jump}
      style={{
        background: currentTheme.background,
      }}
    >
      <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' fill-opacity='0.5' d='M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,250.7C1248,256,1344,288,1392,304L1440,320L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E\")", backgroundRepeat: 'repeat-x', backgroundPosition: 'bottom', backgroundSize: 'contain' }} />
      {pipes.map((pipe, index) => (
        <React.Fragment key={index}>
          <svg className="absolute" style={{ left: pipe.x, top: 0, width: PIPE_WIDTH, height: pipe.height }}>
            <rect width={PIPE_WIDTH} height={pipe.height} fill={currentTheme.pipeColor} />
            <rect width={PIPE_WIDTH} height="20" fill={currentTheme.pipeColor} />
          </svg>
          <svg className="absolute" style={{ left: pipe.x, top: pipe.height + PIPE_GAP, width: PIPE_WIDTH, height: gameSize.height - pipe.height - PIPE_GAP }}>
            <rect width={PIPE_WIDTH} height={gameSize.height - pipe.height - PIPE_GAP} fill={currentTheme.pipeColor} />
            <rect y={gameSize.height - pipe.height - PIPE_GAP - 20} width={PIPE_WIDTH} height="20" fill={currentTheme.pipeColor} />
          </svg>
          {pipe.hasPowerUp && (
            <div
              className="absolute text-2xl"
              style={{
                left: pipe.x + PIPE_WIDTH / 2,
                top: pipe.height + PIPE_GAP / 2,
                transform: 'translate(-50%, -50%)',
              }}
            >
              ⭐
            </div>
          )}
        </React.Fragment>
      ))}
      <div
        className={`absolute text-5xl ${isPoweredUp ? 'animate-pulse' : ''}`}
        style={{
          left: gameSize.width / 2 - BIRD_WIDTH / 2,
          top: birdPosition,
          width: BIRD_WIDTH,
          height: BIRD_HEIGHT,
          transition: 'transform 0.1s',
          transform: `translateY(-50%) rotate(${birdRotation}deg)`,
        }}
      >
        {currentTheme.bird}
      </div>
      <div className="absolute top-4 right-4 text-4xl font-bold text-white drop-shadow-md">
        {score}
      </div>
      {!gameStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white">
          <h1 className="text-6xl font-bold mb-8 animate-pulse">Flappy Adventure</h1>
          <p className="text-2xl mb-8">Tap or press Space to start</p>
          <div className="text-7xl animate-bounce">{currentTheme.bird}</div>
          <div className="mt-8 flex space-x-4">
            {themes.map((theme, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded ${currentTheme.name === theme.name ? 'bg-blue-500' : 'bg-gray-500'} text-white`}
                onClick={() => changeTheme(theme)}
              >
                {theme.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white">
          <div className="text-6xl mb-8 font-bold">
            GAME OVER
          </div>
          <div className="text-4xl mb-4">
            Score: {score}
          </div>
          <div className="text-3xl mb-8">
            Title: {getTitle(score)}
          </div>
          <button
            className="mt-4 px-6 py-3 bg-blue-500 text-white rounded text-2xl hover:bg-blue-600 transition-colors"
            onClick={restartGame}
          >
            Restart
          </button>
        </div>
      )}
    </div>
  );
};

export default FlappyChicken;
