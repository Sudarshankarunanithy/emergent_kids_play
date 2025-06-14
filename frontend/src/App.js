import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';

// Local storage helper functions
const saveProgress = (data) => {
  localStorage.setItem('spideyMathProgress', JSON.stringify(data));
};

const loadProgress = () => {
  const saved = localStorage.getItem('spideyMathProgress');
  return saved ? JSON.parse(saved) : {
    totalStars: 0,
    completedLevels: [],
    currentLevel: 1,
    badges: [],
    streakDays: 0,
    lastPlayDate: null
  };
};

// Game Components
const MathGame = ({ gameType, onComplete }) => {
  const [question, setQuestion] = useState({});
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [gameComplete, setGameComplete] = useState(false);

  const generateQuestion = () => {
    let newQuestion = {};
    
    switch(gameType) {
      case 'addition':
        const a = Math.floor(Math.random() * (level * 5)) + 1;
        const b = Math.floor(Math.random() * (level * 5)) + 1;
        newQuestion = {
          text: `${a} + ${b} = ?`,
          answer: a + b,
          operation: 'addition'
        };
        break;
      
      case 'subtraction':
        const c = Math.floor(Math.random() * (level * 5)) + 5;
        const d = Math.floor(Math.random() * c) + 1;
        newQuestion = {
          text: `${c} - ${d} = ?`,
          answer: c - d,
          operation: 'subtraction'
        };
        break;
      
      case 'shapes':
        const shapes = ['circle', 'square', 'triangle', 'rectangle'];
        const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
        newQuestion = {
          text: `How many ${targetShape}s do you see?`,
          answer: Math.floor(Math.random() * 5) + 1,
          operation: 'counting',
          shape: targetShape
        };
        break;
      
      default:
        newQuestion = {
          text: '2 + 2 = ?',
          answer: 4,
          operation: 'addition'
        };
    }
    
    setQuestion(newQuestion);
  };

  const checkAnswer = () => {
    const isCorrect = parseInt(userAnswer) === question.answer;
    const newScore = isCorrect ? score + 10 : score;
    
    if (isCorrect) {
      setScore(newScore);
      setFeedback('🕷️ Amazing! Spidey is proud!');
      
      // Level up after 3 correct answers
      if (newScore % 30 === 0) {
        setLevel(level + 1);
        setFeedback('🎉 Level Up! You\'re a math superhero!');
      }
    } else {
      setFeedback(`Not quite! The answer is ${question.answer}. Keep trying!`);
    }
    
    setTimeout(() => {
      if (newScore >= 50) {
        setGameComplete(true);
        // Save progress immediately
        const progress = loadProgress();
        progress.totalStars += Math.floor(newScore / 10);
        progress.currentLevel = Math.max(progress.currentLevel, level);
        if (!progress.completedLevels.includes(gameType)) {
          progress.completedLevels.push(gameType);
        }
        // Update last play date
        progress.lastPlayDate = new Date().toISOString();
        console.log('Saving progress:', progress); // Debug log
        saveProgress(progress);
        onComplete(newScore);
      } else {
        generateQuestion();
        setUserAnswer('');
        setFeedback('');
      }
    }, 2000);
  };

  useEffect(() => {
    generateQuestion();
  }, [gameType, level]);

  if (gameComplete) {
    return (
      <div className="text-center">
        <h2 className="text-3xl font-bold text-red-600 mb-4">🏆 Congratulations!</h2>
        <p className="text-xl mb-4">You scored {score} points!</p>
        <p className="text-lg text-gray-600">Spidey says: "With great math comes great responsibility!"</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-red-600 mb-2">Level {level}</h3>
        <div className="flex justify-center items-center space-x-4 mb-4">
          <span className="text-yellow-500">⭐ {score}</span>
          <span className="text-blue-500">🕷️ Spidey Math</span>
        </div>
      </div>
      
      <div className="text-center mb-6">
        <h4 className="text-xl font-semibold mb-4">{question.text}</h4>
        
        {question.shape && (
          <div className="mb-4">
            <div className="flex justify-center space-x-2">
              {Array.from({ length: question.answer }, (_, i) => (
                <div
                  key={i}
                  className={`w-12 h-12 ${
                    question.shape === 'circle' ? 'rounded-full bg-blue-400' :
                    question.shape === 'square' ? 'bg-red-400' :
                    question.shape === 'triangle' ? 'bg-green-400 triangle' :
                    'bg-purple-400'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <input
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          className="w-32 p-3 text-xl text-center border-2 border-red-300 rounded-lg focus:border-red-500 focus:outline-none"
          placeholder="?"
        />
        <br />
        <button
          onClick={checkAnswer}
          disabled={!userAnswer}
          className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          Check Answer
        </button>
      </div>
      
      {feedback && (
        <div className="mt-4 p-3 bg-blue-100 rounded-lg text-center">
          <p className="text-blue-800 font-medium">{feedback}</p>
        </div>
      )}
    </div>
  );
};

const AdventureMode = () => {
  const [currentStory, setCurrentStory] = useState(0);
  const [showGame, setShowGame] = useState(false);
  
  const stories = [
    {
      title: "The Missing Numbers",
      description: "Spidey needs help finding the missing numbers to unlock the secret door!",
      gameType: "addition",
      image: "https://images.pexels.com/photos/12214877/pexels-photo-12214877.jpeg"
    },
    {
      title: "The Shape Mystery",
      description: "Help Spidey count the shapes to solve the mystery!",
      gameType: "shapes",
      image: "https://images.pexels.com/photos/1329292/pexels-photo-1329292.jpeg"
    },
    {
      title: "The Subtraction Challenge",
      description: "The villain has taken some items! Help Spidey calculate what's left!",
      gameType: "subtraction",
      image: "https://images.unsplash.com/photo-1650568922476-7e5aa8ed62b1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxraWRzJTIwc3VwZXJoZXJvJTIwY2FydG9vbnxlbnwwfHx8cmVkfDE3NDk4NjIwMDF8MA&ixlib=rb-4.1.0&q=85"
    }
  ];

  if (showGame) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-100 to-blue-100 p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setShowGame(false)}
            className="mb-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            ← Back to Story
          </button>
          <MathGame 
            gameType={stories[currentStory].gameType}
            onComplete={() => {
              setShowGame(false);
              if (currentStory < stories.length - 1) {
                setCurrentStory(currentStory + 1);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-100 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-red-600 mb-8">
          🕷️ Spidey's Math Adventure
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <img
              src={stories[currentStory].image}
              alt="Adventure"
              className="w-48 h-32 mx-auto rounded-lg object-cover mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {stories[currentStory].title}
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {stories[currentStory].description}
            </p>
          </div>
          
          <div className="text-center">
            <button
              onClick={() => setShowGame(true)}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
            >
              Start Adventure! 🚀
            </button>
          </div>
          
          <div className="flex justify-center mt-6 space-x-2">
            {stories.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentStory ? 'bg-red-500' : 
                  index < currentStory ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ParentCorner = () => {
  const progress = loadProgress();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-purple-600 mb-8">
          📊 Parent Corner
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Progress Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Stars Earned:</span>
                <span className="font-bold text-yellow-500">⭐ {progress.totalStars}</span>
              </div>
              <div className="flex justify-between">
                <span>Levels Completed:</span>
                <span className="font-bold text-green-500">{progress.completedLevels.length}/3</span>
              </div>
              <div className="flex justify-between">
                <span>Current Level:</span>
                <span className="font-bold text-blue-500">{progress.currentLevel}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Completed Activities</h2>
            <div className="space-y-2">
              {progress.completedLevels.map((level, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span className="capitalize">{level} Practice</span>
                </div>
              ))}
              {progress.completedLevels.length === 0 && (
                <p className="text-gray-500 italic">No activities completed yet</p>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 md:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Tips for Parents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold text-lg mb-2">🎯 Encourage Practice</h3>
                <p className="text-gray-600">Regular 10-15 minute sessions work better than long study periods.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">🎉 Celebrate Success</h3>
                <p className="text-gray-600">Praise effort and progress rather than just correct answers.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">🔄 Review Together</h3>
                <p className="text-gray-600">Ask your child to explain how they solved problems.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">🎮 Make it Fun</h3>
                <p className="text-gray-600">Use the adventure mode to keep learning engaging.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const progress = loadProgress();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-red-100">
      {/* Hero Section */}
      <div className="text-center py-12">
        <img
          src="https://images.pexels.com/photos/30514488/pexels-photo-30514488.jpeg"
          alt="Spidey Hero"
          className="w-32 h-32 mx-auto rounded-full object-cover mb-6"
        />
        <h1 className="text-5xl font-bold text-red-600 mb-4">
          🕷️ Spidey's Math Adventure
        </h1>
        <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          Join Spidey and his amazing friends on exciting math adventures! 
          Learn addition, subtraction, shapes, and more while saving the day!
        </p>
        
        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Your Progress</span>
              <span className="text-yellow-500 font-bold">⭐ {progress.totalStars}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-red-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((progress.totalStars / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Game Options */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Addition Game */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <img
              src="https://images.pexels.com/photos/1329292/pexels-photo-1329292.jpeg"
              alt="Addition Game"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-2xl font-bold text-red-600 mb-2">➕ Addition Heroes</h3>
              <p className="text-gray-600 mb-4">Help Spidey add numbers to defeat the villains!</p>
              <Link
                to="/game/addition"
                className="block w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg text-center transition-colors"
              >
                Start Adding! 🚀
              </Link>
            </div>
          </div>
          
          {/* Subtraction Game */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <img
              src="https://images.unsplash.com/photo-1650568922476-7e5aa8ed62b1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxraWRzJTIwc3VwZXJoZXJvJTIwY2FydG9vbnxlbnwwfHx8cmVkfDE3NDk4NjIwMDF8MA&ixlib=rb-4.1.0&q=85"
              alt="Subtraction Game"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-2xl font-bold text-blue-600 mb-2">➖ Subtraction Squad</h3>
              <p className="text-gray-600 mb-4">Save the day by solving subtraction problems!</p>
              <Link
                to="/game/subtraction"
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-center transition-colors"
              >
                Start Subtracting! ⚡
              </Link>
            </div>
          </div>
          
          {/* Shapes Game */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <img
              src="https://images.unsplash.com/photo-1562230753-a701854851a8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxraWRzJTIwc3VwZXJoZXJvJTIwY2FydG9vbnxlbnwwfHx8cmVkfDE3NDk4NjIwMDF8MA&ixlib=rb-4.1.0&q=85"
              alt="Shapes Game"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-2xl font-bold text-green-600 mb-2">🔷 Shape Detective</h3>
              <p className="text-gray-600 mb-4">Identify and count shapes with your spider senses!</p>
              <Link
                to="/game/shapes"
                className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg text-center transition-colors"
              >
                Find Shapes! 🕵️
              </Link>
            </div>
          </div>
          
          {/* Adventure Mode */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow md:col-span-2 lg:col-span-1">
            <img
              src="https://images.pexels.com/photos/12214877/pexels-photo-12214877.jpeg"
              alt="Adventure Mode"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-2xl font-bold text-purple-600 mb-2">🎮 Adventure Mode</h3>
              <p className="text-gray-600 mb-4">Join Spidey on epic math quests and unlock amazing rewards!</p>
              <Link
                to="/adventure"
                className="block w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg text-center transition-colors"
              >
                Start Adventure! 🗺️
              </Link>
            </div>
          </div>
          
          {/* Parent Corner */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow md:col-span-2">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-700 mb-2">👨‍👩‍👧‍👦 Parent Corner</h3>
              <p className="text-gray-600 mb-4">Track your child's progress and get helpful tips for learning at home.</p>
              <Link
                to="/parent"
                className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg text-center transition-colors"
              >
                View Progress 📊
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GamePage = ({ gameType }) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            ← Back Home
          </button>
          <h1 className="text-3xl font-bold text-center text-gray-800 capitalize">
            {gameType} Practice
          </h1>
          <div></div>
        </div>
        
        <MathGame 
          gameType={gameType}
          onComplete={(score) => {
            setTimeout(() => navigate('/'), 3000);
          }}
        />
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game/addition" element={<GamePage gameType="addition" />} />
          <Route path="/game/subtraction" element={<GamePage gameType="subtraction" />} />
          <Route path="/game/shapes" element={<GamePage gameType="shapes" />} />
          <Route path="/adventure" element={<AdventureMode />} />
          <Route path="/parent" element={<ParentCorner />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;