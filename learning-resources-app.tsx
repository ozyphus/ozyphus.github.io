import React, { useState, useEffect } from 'react';
import { ExternalLink, Check, X, Grid3X3, List, BookOpen, Star, Clock, Target, TrendingUp } from 'lucide-react';

// Types
interface GridItem {
  description: string;
  url?: string;
  subTopic?: string;
  priority?: string;
  completed?: boolean;
}

interface Block {
  id: string;
  title: string;
  items: GridItem[];
  order: number;
}

interface CollectionBlock {
  blockId: string;
  blockTitle: string;
  selectedItemIndices: number[];
  newItems: GridItem[];
  order: number;
}

interface Collection {
  id: string;
  title: string;
  description?: string;
  blocks: CollectionBlock[];
  createdAt: string;
  updatedAt: string;
}

interface StudyProgress {
  [collectionId: string]: {
    [blockId: string]: {
      selectedItems: boolean[];
      newItems: boolean[];
    };
  };
}

// Custom hook for study progress
const useStudyProgress = () => {
  const [progress, setProgress] = useState<StudyProgress>({});

  useEffect(() => {
    const savedProgress = localStorage.getItem('studyProgress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, []);

  const updateProgress = (collectionId: string, blockId: string, itemType: 'selectedItems' | 'newItems', itemIndex: number, completed: boolean) => {
    setProgress(prev => {
      const newProgress = { ...prev };
      if (!newProgress[collectionId]) newProgress[collectionId] = {};
      if (!newProgress[collectionId][blockId]) {
        newProgress[collectionId][blockId] = { selectedItems: [], newItems: [] };
      }
      
      newProgress[collectionId][blockId][itemType][itemIndex] = completed;
      localStorage.setItem('studyProgress', JSON.stringify(newProgress));
      return newProgress;
    });
  };

  const getItemCompletion = (collectionId: string, blockId: string, itemType: 'selectedItems' | 'newItems', itemIndex: number): boolean => {
    return progress[collectionId]?.[blockId]?.[itemType]?.[itemIndex] || false;
  };

  const getBlockProgress = (collectionId: string, blockId: string, selectedItemsCount: number, newItemsCount: number) => {
    const blockProgress = progress[collectionId]?.[blockId];
    if (!blockProgress) return { completed: 0, total: selectedItemsCount + newItemsCount };
    
    const selectedCompleted = blockProgress.selectedItems?.filter(Boolean).length || 0;
    const newCompleted = blockProgress.newItems?.filter(Boolean).length || 0;
    
    return {
      completed: selectedCompleted + newCompleted,
      total: selectedItemsCount + newItemsCount
    };
  };

  const getCollectionProgress = (collection: Collection) => {
    let totalItems = 0;
    let completedItems = 0;
    
    collection.blocks.forEach(block => {
      const selectedCount = block.selectedItemIndices.length;
      const newCount = block.newItems.length;
      const blockProg = getBlockProgress(collection.id, block.blockId, selectedCount, newCount);
      
      totalItems += blockProg.total;
      completedItems += blockProg.completed;
    });
    
    return { completed: completedItems, total: totalItems };
  };

  return { updateProgress, getItemCompletion, getBlockProgress, getCollectionProgress };
};

// Priority badge component
const PriorityBadge = ({ priority }: { priority?: string }) => {
  if (!priority) return null;
  
  const colors = {
    'Must Do': 'bg-red-500 text-white',
    'Basics': 'bg-blue-500 text-white',
    'Coding': 'bg-purple-500 text-white',
    'Quick Prep': 'bg-green-500 text-white',
    'Good to Know': 'bg-gray-500 text-white',
    'high': 'bg-red-500 text-white',
    'medium': 'bg-yellow-500 text-black',
    'low': 'bg-green-500 text-white'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[priority] || 'bg-gray-300 text-black'}`}>
      {priority}
    </span>
  );
};

// Card popup component
const CardPopup = ({ item, onClose, showCheckbox, isCompleted, onToggleComplete }: {
  item: GridItem;
  onClose: () => void;
  showCheckbox?: boolean;
  isCompleted?: boolean;
  onToggleComplete?: () => void;
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl max-w-md w-full p-6 transform transition-all duration-300 scale-100" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 flex-1">
          {showCheckbox && (
            <button
              onClick={onToggleComplete}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'
              }`}
            >
              {isCompleted && <Check className="w-4 h-4" />}
            </button>
          )}
          <h3 className="text-xl font-bold text-gray-800 flex-1">{item.description}</h3>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {item.subTopic && (
        <p className="text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">{item.subTopic}</p>
      )}
      
      <div className="flex items-center justify-between">
        <PriorityBadge priority={item.priority} />
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-semibold"
          >
            Open Link <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  </div>
);

// Block card component
const BlockCard = ({ block, onClick }: { block: Block; onClick: () => void }) => (
  <div
    onClick={onClick}
    className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-200 group"
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
        <BookOpen className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{block.title}</h3>
    </div>
    
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span className="flex items-center gap-1">
        <List className="w-4 h-4" />
        {block.items.length} items
      </span>
      <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-semibold">
        Study Now
      </div>
    </div>
  </div>
);

// Collection card component
const CollectionCard = ({ collection, onClick, progress }: { collection: Collection; onClick: () => void; progress: { completed: number; total: number } }) => {
  const isComplete = progress.total > 0 && progress.completed === progress.total;
  const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-purple-100 hover:border-purple-200 group relative overflow-hidden"
    >
      {isComplete && (
        <div className="absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <Star className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">{collection.title}</h3>
          {collection.description && (
            <p className="text-sm text-gray-600 mt-1">{collection.description}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 flex items-center gap-1">
            <Target className="w-4 h-4" />
            {collection.blocks.length} blocks
          </span>
          <span className="text-gray-600 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {progress.completed}/{progress.total} items
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">{percentage}% Complete</span>
          <div className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full font-semibold text-sm">
            Continue Learning
          </div>
        </div>
      </div>
    </div>
  );
};

// Block detail view for collections
const CollectionBlockDetail = ({ collection, block, allBlocks, onBack, studyProgress }: {
  collection: Collection;
  block: CollectionBlock;
  allBlocks: Block[];
  onBack: () => void;
  studyProgress: ReturnType<typeof useStudyProgress>;
}) => {
  const [selectedCard, setSelectedCard] = useState<GridItem | null>(null);
  const originalBlock = allBlocks.find(b => b.id === block.blockId);
  
  const selectedItems = originalBlock ? block.selectedItemIndices.map(index => originalBlock.items[index]) : [];
  const allItems = [...selectedItems, ...block.newItems];
  
  const blockProgress = studyProgress.getBlockProgress(collection.id, block.blockId, selectedItems.length, block.newItems.length);
  const percentage = blockProgress.total > 0 ? Math.round((blockProgress.completed / blockProgress.total) * 100) : 0;
  const isComplete = blockProgress.total > 0 && blockProgress.completed === blockProgress.total;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold">
          ← Back to Collection
        </button>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-600">{blockProgress.completed}/{blockProgress.total} completed</div>
            <div className="text-lg font-bold text-gray-800">{percentage}%</div>
          </div>
          {isComplete && (
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{block.blockTitle}</h2>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allItems.map((item, index) => {
            const isSelectedItem = index < selectedItems.length;
            const itemType = isSelectedItem ? 'selectedItems' : 'newItems';
            const itemIndex = isSelectedItem ? index : index - selectedItems.length;
            const isCompleted = studyProgress.getItemCompletion(collection.id, block.blockId, itemType, itemIndex);
            
            return (
              <div
                key={index}
                className={`bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border transition-all duration-300 cursor-pointer hover:shadow-md group ${
                  isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => setSelectedCard(item)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      studyProgress.updateProgress(collection.id, block.blockId, itemType, itemIndex, !isCompleted);
                    }}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-1 ${
                      isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {isCompleted && <Check className="w-3 h-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm mb-2 group-hover:text-purple-600 transition-colors ${
                      isCompleted ? 'text-green-700' : 'text-gray-800'
                    }`}>
                      {item.description}
                    </h3>
                    {item.subTopic && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{item.subTopic}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <PriorityBadge priority={item.priority} />
                  {item.url && (
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedCard && (
        <CardPopup
          item={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
};

// Collection view component
const CollectionView = ({ collection, allBlocks, onBack, studyProgress }: {
  collection: Collection;
  allBlocks: Block[];
  onBack: () => void;
  studyProgress: ReturnType<typeof useStudyProgress>;
}) => {
  const [selectedBlock, setSelectedBlock] = useState<CollectionBlock | null>(null);
  
  const collectionProgress = studyProgress.getCollectionProgress(collection);
  const percentage = collectionProgress.total > 0 ? Math.round((collectionProgress.completed / collectionProgress.total) * 100) : 0;
  const isComplete = collectionProgress.total > 0 && collectionProgress.completed === collectionProgress.total;

  if (selectedBlock) {
    return (
      <CollectionBlockDetail
        collection={collection}
        block={selectedBlock}
        allBlocks={allBlocks}
        onBack={() => setSelectedBlock(null)}
        studyProgress={studyProgress}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold">
          ← Back to Collections
        </button>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-600">{collectionProgress.completed}/{collectionProgress.total} completed</div>
            <div className="text-lg font-bold text-gray-800">{percentage}%</div>
          </div>
          {isComplete && (
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{collection.title}</h2>
        {collection.description && (
          <p className="text-gray-600 mb-4">{collection.description}</p>
        )}
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collection.blocks
          .sort((a, b) => a.order - b.order)
          .map((block) => {
            const originalBlock = allBlocks.find(b => b.id === block.blockId);
            const selectedItemsCount = block.selectedItemIndices.length;
            const newItemsCount = block.newItems.length;
            const blockProgress = studyProgress.getBlockProgress(collection.id, block.blockId, selectedItemsCount, newItemsCount);
            const blockPercentage = blockProgress.total > 0 ? Math.round((blockProgress.completed / blockProgress.total) * 100) : 0;
            const blockComplete = blockProgress.total > 0 && blockProgress.completed === blockProgress.total;

            return (
              <div
                key={block.blockId}
                onClick={() => setSelectedBlock(block)}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-purple-200 group relative"
              >
                {blockComplete && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-600 transition-colors flex-1">
                    {block.blockTitle}
                  </h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{selectedItemsCount + newItemsCount} items</span>
                    <span>{blockProgress.completed}/{blockProgress.total} done</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        blockComplete ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'
                      }`}
                      style={{ width: `${blockPercentage}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{blockPercentage}%</span>
                    <div className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full font-semibold text-sm">
                      Study
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

// Main App component
const App = () => {
  const [view, setView] = useState<'blocks' | 'collections'>('blocks');
  const [selectedCard, setSelectedCard] = useState<GridItem | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const studyProgress = useStudyProgress();

  // Complete data from the JSON file
  const data = {
    blocks: [
      {
        id: "1754200642526",
        title: "ML Foundation",
        items: [
          {
            description: "Machine Learning Basics",
            url: "https://youtube.com/playlist?list=PLblh5JKOoLUICTaGLRoHQDuF_7q2GfuJF&si=9-P7ta_HwjC2qtSR",
            subTopic: "Short videos with first principle approach",
            priority: "Basics"
          }
        ],
        order: 0
      },
      {
        id: "1754200651784",
        title: "ML Pro",
        items: [
          {
            description: "Modeling Practice",
            url: "https://platform.stratascratch.com/technical?question_types=modeling",
            subTopic: "ML Modeling"
          },
          {
            description: "ML Coding",
            url: "https://www.deep-ml.com/collections/Machine%20Learning",
            priority: "Coding"
          }
        ],
        order: 1
      },
      {
        id: "1754200671324",
        title: "ML On the Go",
        items: [
          {
            description: "ML Topics",
            url: "https://devinterview.io/questions/machine-learning-and-data-science",
            subTopic: "Question and Answer Format",
            priority: "Quick Prep"
          },
          {
            description: "ML Algorithms from ml-interviews-book",
            url: "https://chatgpt.com/s/688bfbcc09f481918bbbd5ddd7b8fb83",
            subTopic: "https://huyenchip.com/ml-interviews-book/contents/chapter-8.-machine-learning-algorithms.html",
            priority: "Quick Prep"
          }
        ],
        order: 2
      },
      {
        id: "1754200707103",
        title: "DL Foundation",
        items: [
          {
            description: "DL Basics",
            url: "https://youtube.com/playlist?list=PL5-TkQAfAZFbzxjBHtzdVCWE0Zbhomg7r&si=kZgC_V5wljkrB4nv",
            subTopic: "DL Foundation at its best",
            priority: "Must Do"
          },
          {
            description: "DL Basics in first few lectures",
            url: "https://youtube.com/playlist?list=PLkt2uSq6rBVctENoVBg1TpCC7OQi31AlC&si=5QV-naKR3JrYodSZ",
            subTopic: "Karpathy's Original 231n iconic DL",
            priority: "Basics"
          },
          {
            description: "DL Basics Reading",
            url: "https://cs231n.github.io/",
            subTopic: "Very important material for foundation",
            priority: "Must Do"
          },
          {
            description: "Classic DL Book",
            url: "https://www.deeplearningbook.org/contents/ml.html",
            priority: "Good to Know"
          }
        ],
        order: 3
      },
      {
        id: "1754200714406",
        title: "DL Pro",
        items: [
          {
            description: "Deep Learning Coding",
            url: "https://www.deep-ml.com/collections/Deep%20Learning",
            priority: "Coding"
          },
          {
            description: "Papers in 231n Course",
            url: "https://cs231n.stanford.edu/schedule.html"
          }
        ],
        order: 4
      },
      {
        id: "1754200722132",
        title: "DL On the Go",
        items: [
          {
            description: "DL Topics",
            url: "https://devinterview.io/questions/machine-learning-and-data-science/deep-learning-interview-questions/",
            subTopic: "Q&A format",
            priority: "Quick Prep"
          }
        ],
        order: 5
      },
      {
        id: "1754200745201",
        title: "Algo & Data Structures Foundation",
        items: [
          {
            description: "Quick and Organized Material",
            url: "https://algo.monster/dashboard",
            subTopic: "Coding Interview Patterns",
            priority: "Coding"
          },
          {
            description: "Patterns in Coding Interview",
            url: "https://blog.algomaster.io/p/15-leetcode-patterns"
          }
        ],
        order: 6
      },
      {
        id: "1754200799253",
        title: "Algo & Data Structures Pro",
        items: [
          {
            description: "The Algorithm Design Manual",
            url: "https://a.co/d/fQR64OR",
            priority: "Good to Know"
          }
        ],
        order: 7
      },
      {
        id: "1754200825209",
        title: "Algo & Data Structures On the Go",
        items: [
          {
            description: "Maths and Computer Science from ML Interview Book",
            url: "https://chatgpt.com/s/688c023d02908191a27bd479c62498b4",
            subTopic: "https://huyenchip.com/ml-interviews-book/contents/chapter-5.-math.html",
            priority: "Quick Prep"
          },
          {
            description: "Data Structure Algorithms Q&A",
            url: "https://devinterview.io/questions/data-structures-and-algorithms"
          },
          {
            description: "Hello Interview",
            url: "https://www.hellointerview.com/dashboard",
            priority: "Quick Prep"
          },
          {
            description: "BigO Cheat Sheet",
            url: "https://www.bigocheatsheet.com/"
          }
        ],
        order: 8
      },
      {
        id: "1754201039917",
        title: "System Design Foundation",
        items: [
          {
            description: "System Design Basics",
            url: "https://systemdesignschool.io/courses",
            priority: "Basics"
          },
          {
            description: "System Design Book",
            url: "https://a.co/d/7FJo1Nq",
            priority: "Basics"
          },
          {
            description: "Byte Byte Go System Design Fundamentals",
            url: "https://youtube.com/playlist?list=PLCRMIe5FDPsd0gVs500xeOewfySTsmEjf&si=i7oLvO_Tvm8Zj2-K"
          }
        ],
        order: 9
      },
      {
        id: "1754201050826",
        title: "System Design Pro",
        items: [
          {
            description: "System Design Practice Set",
            url: "https://systemdesignschool.io/problems",
            subTopic: ""
          },
          {
            description: "System Design Book Vol II",
            url: "https://a.co/d/6MnasNA"
          },
          {
            description: "Designing Data Intensive Applications",
            url: "https://a.co/d/d2EwDKD"
          },
          {
            description: "Byte Byte Go Visual Guides",
            url: "https://bytebytego.com/guides/"
          },
          {
            description: "Byte Byte Go Courses",
            url: "https://bytebytego.com/my-courses"
          }
        ],
        order: 10
      },
      {
        id: "1754201063643",
        title: "System Design On the Go",
        items: [
          {
            description: "System Design Q & A",
            url: "https://devinterview.io/questions/software-architecture-and-system-design"
          },
          {
            description: "Hello Interview",
            url: "https://www.hellointerview.com/dashboard",
            priority: "Quick Prep"
          },
          {
            description: "30-system-design-concepts",
            url: "https://blog.algomaster.io/p/30-system-design-concepts"
          }
        ],
        order: 11
      },
      {
        id: "1754201112141",
        title: "LLM Foundation",
        items: [
          {
            description: "Transformer Basics",
            url: "https://jalammar.github.io/visualizing-neural-machine-translation-mechanics-of-seq2seq-models-with-attention/"
          },
          {
            description: "CS336 Language Modeling from Scratch",
            url: "https://stanford-cs336.github.io/spring2025/",
            priority: "Basics"
          },
          {
            description: "CS336 Language Modeling from Scratch Videos",
            url: "https://youtube.com/playlist?list=PLoROMvodv4rOY23Y0BoGoBGgQ1zmU_MT_&si=dsLj7wKAI7pmMFWx"
          },
          {
            description: "Positional Encoding",
            url: "https://erdem.pl/2021/05/understanding-positional-encoding-in-transformers"
          },
          {
            description: "Fine Tune LLMs Experiment",
            url: "https://docs.unsloth.ai/get-started/beginner-start-here",
            priority: "Coding"
          }
        ],
        order: 12
      },
      {
        id: "1754201121477",
        title: "LLM Pro",
        items: [],
        order: 13
      },
      {
        id: "1754201137188",
        title: "LLM On the Go",
        items: [
          {
            description: "LLM",
            url: "https://devinterview.io/questions/machine-learning-and-data-science/llms-interview-questions/"
          }
        ],
        order: 14
      },
      {
        id: "1754201218353",
        title: "AI System Design Foundation",
        items: [
          {
            description: "AI Engineering",
            url: "https://a.co/d/hun6ojc"
          },
          {
            description: "Designing ML Systems",
            url: "https://a.co/d/9t5dN7v"
          }
        ],
        order: 15
      },
      {
        id: "1754201245275",
        title: "AI System Design Pro",
        items: [
          {
            description: "Airbnb's end-to-end Machine Learning",
            url: "https://vimeo.com/274801958?turnstile=0.NH5Sg51FDWziFWt4XIPAPQKYzosF9de9clTzOPD2NihfBL-Fx_CZ4szdEaUYzvf_BUuMTcJKOtuiqDPmHPt0V9urLth4SfL4Tewl2LbzecClcQ_QaO4jiegzFf0vQTNg4lzgD7imfqrqvMXYWYFB8Jilb6OAMmhYPqB1aVp5g3QbgT9VALOT1Basq2kNZEYqpFfIvbqXg8qnCxR69K4P6tuInnn5xXT7Vp_8NaGn_CzQmGO-gGfnd8X85fKkt_z-x_lmRSkOCdYOt1Zb5_ufXDdeft5JQYvEQXbVQ6hsbYVwjialW6TT85WjOTpsamSudfIkdJ6DEAe_GsALgvSRw50p65YlsekB2PzGkQsAoppJAKAX8nBS52bYHb_bcyrKVrBHs_gBKE7IB19W80sgzz2y4qOvXeK0N20msHEr4dQdoX1k8oHhDYt0yyHWN_T3LFFn4bpunzoRjaFKTyw3fxikvoa8P47P0Hbn6T2sLgP3BGQyWMYaicJ_Xk5a7yeO6v6Z_cVENmYF6jyCbwrHiE3Dtovx6akbPDZV5sEH6EtZCsqV0goK7CEFqs6WXZp5KtUe_YQGFOJPTIlxczeJDKQw8ke4AElSnq_5V0p2vq4hb4sbGy_ismWEooXItnNYmPqkfqlWwUGXHJsdgXNG_XEHpMPZPdUhP8He1iOX5a5ktckHqiCriNn_6qp45sOcnLB9wwNXXIueZHLKiabQStM4PY2yVzVhYzEmA8rxA_eKYR0cUQIy6jkkDV1DRhBCMm5H4jX8N9ruGSI9IHj7XK7uvrW0Ybnba_vmFakzrFqiBMgpXMPEihzL2FTK73zt7F7Fvf1RR8MTrBrgNMyhhByZFEj5giFFd5CHrDBkbPXFYhEr1BBuGe8bJ7w-yfQpKUIWmrSh3HSfz2Nsi9VBPu0Tv8rKUiFG6DSylta8TCM.GzkxUmmc-ZEhvqxVhVu1Sg.188705e8dc427f5e0b5f34c7c28f35e757a8a84622b78b90c55947ba3def41ab"
          },
          {
            description: "Gen AI System Design",
            url: "https://a.co/d/23FRAYX"
          }
        ],
        order: 16
      },
      {
        id: "1754201255906",
        title: "AI System Design On the Go",
        items: [
          {
            description: "ML Design Patterns",
            url: "https://devinterview.io/questions/machine-learning-and-data-science/ml-design-patterns-interview-questions/"
          },
          {
            description: "ML Ops Q&A",
            url: "https://devinterview.io/questions/machine-learning-and-data-science/mlops-interview-questions/"
          },
          {
            description: "LLM Ops Q&A",
            url: "https://devinterview.io/questions/machine-learning-and-data-science/llmops-interview-questions/"
          }
        ],
        order: 17
      },
      {
        id: "1754201314342",
        title: "Maths for Engineers",
        items: [
          {
            description: "Maths for Machine Learning Book",
            url: "https://mml-book.github.io/book/mml-book.pdf",
            priority: "Basics"
          },
          {
            description: "Probability and Statistics",
            url: "https://platform.stratascratch.com/technical?question_types=probability&question_types=statistics"
          },
          {
            description: "Stats",
            url: "https://youtube.com/playlist?list=PLjkGGeSpKj65Y9Edz4w5UQp03dVg3apYv&si=yxpK8YFSd0i04JQJ",
            priority: "Basics"
          },
          {
            description: "Stat Quest Statistics",
            url: "https://youtube.com/playlist?list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9&si=R6PyjbJUGcYN3QCA",
            priority: "Basics"
          },
          {
            description: "Deep Learning Book Maths Chapter",
            url: "https://www.deeplearningbook.org/contents/ml.html"
          }
        ],
        order: 18
      },
      {
        id: "1754201357004",
        title: "Grab a Python",
        items: [
          {
            description: "Python Doc",
            url: "https://docs.python.org/3/tutorial/",
            priority: "Good to Know"
          },
          {
            description: "Python On the Go",
            url: "https://devinterview.io/questions/web-and-mobile-development/python-interview-questions/",
            priority: "Quick Prep"
          },
          {
            description: "Geeks Python Interview",
            url: "https://www.geeksforgeeks.org/python/python-interview-questions/"
          }
        ],
        order: 19
      },
      {
        id: "1754201416820",
        title: "Let's C++",
        items: [
          {
            description: "C++ On the Go",
            url: "https://devinterview.io/questions/web-and-mobile-development/c++-interview-questions/",
            priority: "Quick Prep"
          },
          {
            description: "Geeks C++",
            url: "https://www.geeksforgeeks.org/cpp/cpp-interview-questions/"
          }
        ],
        order: 20
      },
      {
        id: "1754201473798",
        title: "All about PyTorch",
        items: [
          {
            description: "PyTorch Basics",
            url: "https://sebastianraschka.com/teaching/pytorch-1h/",
            priority: "Basics"
          }
        ],
        order: 21
      },
      {
        id: "1754201497368",
        title: "ML Model Optimization",
        items: [
          {
            description: "Efficient ML",
            url: "https://youtube.com/playlist?list=PL80kAHvQbh-pT4lCkDT53zT8DKmhE0idB&si=JbTwc4O_ejBMatlz"
          },
          {
            description: "Efficient ML Slides",
            url: "https://hanlab.mit.edu/courses/2024-fall-65940"
          }
        ],
        order: 22
      },
      {
        id: "1754201598946",
        title: "AIML Engineering & Operations",
        items: [
          {
            description: "Chapter 7. Machine learning workflows Sub-topic",
            url: "https://chatgpt.com/s/688bf32e33108191abe69cf48d0e4275",
            subTopic: "https://huyenchip.com/ml-interviews-book/contents/chapter-7.-machine-learning-workflows.html",
            priority: "Quick Prep"
          }
        ],
        order: 23
      },
      {
        id: "1754201707526",
        title: "Scaling AI Infra (GPU goes Brrrrr!)",
        items: [
          {
            description: "Modern Day Training at Scale from Hugging Face",
            url: "https://huggingface.co/spaces/nanotron/ultrascale-playbook?section=high-level_overview",
            priority: "Must Do"
          },
          {
            description: "C229s ML System Design",
            url: "https://cs229s.stanford.edu/fall2023/calendar/"
          },
          {
            description: "ML Infra Deep Research",
            url: "https://chatgpt.com/share/68708481-7010-8009-b5ab-6c5194c9816c"
          }
        ],
        order: 24
      },
      {
        id: "1754201845754",
        title: "New Model Experiments",
        items: [],
        order: 25
      },
      {
        id: "1754201900358",
        title: "Last Month in AI",
        items: [],
        order: 26
      },
      {
        id: "1754202024576",
        title: "RL and Deep RL",
        items: [
          {
            description: "RL Must do for OpenAI Roles",
            url: "https://stable-baselines3.readthedocs.io/en/master/guide/rl.html",
            priority: "Basics"
          },
          {
            description: "Deep RL UC Berkeley",
            url: "https://youtube.com/playlist?list=PLwRJQ4m4UJjNymuBM9RdmB3Z9N5-0IlY0&si=pxV5CnZyelrwlWbt"
          },
          {
            description: "OpenAI Must Do",
            url: "https://spinningup.openai.com/en/latest/"
          }
        ],
        order: 27
      },
      {
        id: "1754202194345",
        title: "New Agentic Workflows",
        items: [
          {
            description: "Anthropic New Age Learning",
            url: "https://www.anthropic.com/learn"
          }
        ],
        order: 28
      },
      {
        id: "1754202227998",
        title: "All About Agents",
        items: [
          {
            description: "Open AI Agents",
            url: "https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf"
          },
          {
            description: "Model Context Protocols",
            url: "https://modelcontextprotocol.io/docs/getting-started/intro"
          },
          {
            description: "Multi Agent Research from Anthropic",
            url: "https://www.anthropic.com/engineering/built-multi-agent-research-system"
          },
          {
            description: "MCP",
            url: "https://www.youtube.com/watch?v=kQmXtrmQ5Zg&t=5839s"
          },
          {
            description: "Chip Huyen Agents Blog",
            url: "https://huyenchip.com/2025/01/07/agents.html"
          }
        ],
        order: 29
      },
      {
        id: "1754202247156",
        title: "Computer Vision On the Go",
        items: [],
        order: 30
      },
      {
        id: "1754202261758",
        title: "Estimation Science On the Go",
        items: [],
        order: 31
      },
      {
        id: "1754202463289",
        title: "Good Reads!",
        items: [
          {
            description: "Interview Guide",
            url: "https://www.techinterviewhandbook.org/software-engineering-interview-guide/"
          },
          {
            description: "Blogs for ML DL AI",
            url: "https://www.trybackprop.com/blog/page/2"
          },
          {
            description: "Blogs with extensive materials",
            url: "https://aman.ai/"
          },
          {
            description: "Computer Science Stuff",
            url: "https://highscalability.com/google-pro-tip-use-back-of-the-envelope-calculations-to-choo/"
          }
        ],
        order: 32
      },
      {
        id: "1754202497810",
        title: "Good Listens!",
        items: [],
        order: 33
      },
      {
        id: "1754202543198",
        title: "Good Watchs!",
        items: [],
        order: 34
      },
      {
        id: "1754202877398",
        title: "ML Model Architectures",
        items: [],
        order: 35
      },
      {
        id: "1754202899069",
        title: "ML Model Evaluation & Benchmarking",
        items: [],
        order: 36
      },
      {
        id: "1754204412648",
        title: "Robotics",
        items: [],
        order: 37
      },
      {
        id: "1754204460108",
        title: "Just Practice",
        items: [
          {
            description: "Leet code for AIML",
            url: "https://www.deep-ml.com/",
            priority: "Coding"
          }
        ],
        order: 38
      },
      {
        id: "1754237829144",
        title: "Company Specifics",
        items: [
          {
            description: "Google Interview",
            url: "https://techdevguide.withgoogle.com/paths/interview/"
          },
          {
            description: "OpenAI Interview",
            url: "https://openai.com/interview-guide/"
          },
          {
            description: "Anthropic",
            url: "https://www.anthropic.com/candidate-ai-guidance"
          }
        ],
        order: 39
      },
      {
        id: "1754238040621",
        title: "AI Research",
        items: [
          {
            description: "Top Must Read Seminal Papers",
            url: "https://arc.net/folder/D0472A20-9C20-4D3F-B145-D2865C0A9FEE"
          },
          {
            description: "Diffusion Models Explained",
            url: "https://poloclub.github.io/diffusion-explainer/"
          },
          {
            description: "Diffusion Explained in Video",
            url: "https://youtu.be/iv-5mZ_9CPY?si=g385mCZL0cw8e6ls"
          }
        ],
        order: 40
      },
      {
        id: "1754202005250",
        title: "Web Mobile Cloud on the Go",
        items: [
          {
            description: "Introduction to Microservices, Docker, and Kubernetes",
            url: "https://www.youtube.com/watch?v=1xo-0gCVhTU",
            subTopic: ""
          }
        ],
        order: 41
      },
      {
        id: "7cf23133-5121-48c3-bf37-33ee64f46291",
        title: "Cheat sheets and Quick Reads",
        items: [
          {
            description: "ML/DL Algorithms with Mathematical Intuition & Real-World Examples",
            priority: "medium",
            url: "https://docs.google.com/document/d/1KmmYkmNSmagQv2N7CVmwQ8D-8Ac8V8tY_ERluoJ3mOc/edit?usp=sharing"
          },
          {
            description: "ML/DL Architecture Reference Guide",
            priority: "medium",
            url: "https://docs.google.com/document/d/13-K_ipBrZw26ItbIT-xnhNAHsgrCdcdYJCV8e_J59nA/edit?usp=sharing"
          },
          {
            description: "One Liners ML Model Architectures",
            priority: "medium",
            url: "https://docs.google.com/document/d/1eivYViwwzi1FVF5zblu7QklIQX4Cwm3tYx2K9JjCs_4/edit?usp=sharing"
          }
        ],
        order: 42
      }
    ],
    collections: [
      {
        id: "5d76cb14-d581-4926-b952-56297cb2ee3a",
        title: "Coding Interview Fast Track",
        blocks: [
          {
            blockId: "1754200825209",
            blockTitle: "Algo & Data Structures On the Go",
            selectedItemIndices: [0, 1, 2, 3],
            newItems: [],
            order: 0
          },
          {
            blockId: "1754201063643",
            blockTitle: "System Design On the Go",
            selectedItemIndices: [0, 1, 2],
            newItems: [],
            order: 1
          },
          {
            blockId: "1754200745201",
            blockTitle: "Algo & Data Structures Foundation",
            selectedItemIndices: [0, 1],
            newItems: [],
            order: 2
          },
          {
            blockId: "1754201039917",
            blockTitle: "System Design Foundation",
            selectedItemIndices: [0, 1, 2],
            newItems: [],
            order: 3
          },
          {
            blockId: "1754202005250",
            blockTitle: "Web Mobile Cloud on the Go",
            selectedItemIndices: [0],
            newItems: [
              {
                description: "web-and-mobile Q&A",
                subTopic: "",
                priority: "medium",
                url: "https://devinterview.io/questions/web-and-mobile-development"
              }
            ],
            order: 4
          },
          {
            blockId: "1754201357004",
            blockTitle: "Grab a Python",
            selectedItemIndices: [0, 1, 2],
            newItems: [],
            order: 5
          },
          {
            blockId: "1754201416820",
            blockTitle: "Let's C++",
            selectedItemIndices: [0, 1],
            newItems: [],
            order: 6
          },
          {
            blockId: "1754201050826",
            blockTitle: "System Design Pro",
            selectedItemIndices: [0, 1, 2, 3, 4],
            newItems: [],
            order: 7
          },
          {
            blockId: "1754202463289",
            blockTitle: "Good Reads!",
            selectedItemIndices: [0, 1, 2, 3],
            newItems: [],
            order: 8
          }
        ],
        createdAt: "2025-08-05T20:16:07.705Z",
        updatedAt: "2025-08-08T15:24:53.459Z"
      },
      {
        id: "e277f220-18fb-4180-84cf-b14844b14728",
        title: "AI Engineer Fast Track",
        description: "Foundation for advanced AI learning. \nAssumes familiarity with ML Maths and ML Concepts.",
        blocks: [
          {
            blockId: "1754201314342",
            blockTitle: "Maths for Engineers",
            selectedItemIndices: [0, 3],
            newItems: [
              {
                description: "Maths from DL Book",
                subTopic: "",
                priority: "high",
                url: "https://www.deeplearningbook.org/contents/part_basics.html"
              },
              {
                description: "Prompt an LLM to learn the core maths for DL",
                subTopic: "",
                priority: "medium",
                url: ""
              }
            ],
            order: 0
          },
          {
            blockId: "1754200642526",
            blockTitle: "ML Foundation",
            selectedItemIndices: [0],
            newItems: [
              {
                description: "ML from DL Book",
                subTopic: "",
                priority: "medium",
                url: "https://www.deeplearningbook.org/contents/ml.html"
              }
            ],
            order: 1
          },
          {
            blockId: "1754201473798",
            blockTitle: "All about PyTorch",
            selectedItemIndices: [0],
            newItems: [],
            order: 2
          },
          {
            blockId: "1754200707103",
            blockTitle: "DL Foundation",
            selectedItemIndices: [0, 2],
            newItems: [],
            order: 3
          },
          {
            blockId: "1754200651784",
            blockTitle: "ML Pro",
            selectedItemIndices: [1],
            newItems: [],
            order: 4
          },
          {
            blockId: "1754200714406",
            blockTitle: "DL Pro",
            selectedItemIndices: [0],
            newItems: [
              {
                description: "Papers in 231n course",
                subTopic: "",
                priority: "medium",
                url: "https://cs231n.stanford.edu/schedule.html"
              }
            ],
            order: 5
          },
          {
            blockId: "1754201112141",
            blockTitle: "LLM Foundation",
            selectedItemIndices: [1, 2],
            newItems: [
              {
                description: "Fine Tune LLM",
                subTopic: "",
                priority: "medium",
                url: "https://docs.unsloth.ai/get-started/beginner-start-here"
              }
            ],
            order: 6
          },
          {
            blockId: "1754201497368",
            blockTitle: "ML Model Optimization",
            selectedItemIndices: [0, 1],
            newItems: [],
            order: 7
          },
          {
            blockId: "1754202024576",
            blockTitle: "RL and Deep RL",
            selectedItemIndices: [0, 1, 2],
            newItems: [],
            order: 8
          },
          {
            blockId: "1754201218353",
            blockTitle: "AI System Design Foundation",
            selectedItemIndices: [0, 1],
            newItems: [
              {
                description: "Gen AI System Design",
                subTopic: "",
                priority: "medium",
                url: "https://www.amazon.com/dp/1736049143?ref=cm_sw_r_ffobk_cp_ud_dp_F1DY99REWZP3635G25JN&ref_=cm_sw_r_ffobk_cp_ud_dp_F1DY99REWZP3635G25JN&social_share=cm_sw_r_ffobk_cp_ud_dp_F1DY99REWZP3635G25JN&bestFormat=true&csmig=1"
              }
            ],
            order: 9
          },
          {
            blockId: "1754201707526",
            blockTitle: "Scaling AI Infra (GPU goes Brrrrr!)",
            selectedItemIndices: [0, 2],
            newItems: [
              {
                description: "Distributed Training",
                subTopic: "",
                priority: "medium",
                url: "https://distributedlexicon.com/"
              }
            ],
            order: 10
          },
          {
            blockId: "7cf23133-5121-48c3-bf37-33ee64f46291",
            blockTitle: "Cheat sheets and Quick Reads",
            selectedItemIndices: [0, 1, 2],
            newItems: [
              {
                description: "GPU Maths from Claude",
                subTopic: "",
                priority: "medium",
                url: "https://docs.google.com/document/d/1IGLH_h1sZakZDNEUTt2J4vroRA-9VO2Pt_crEAvdrJw/edit?usp=sharing"
              },
              {
                description: "ML Interview Book Q&A",
                subTopic: "",
                priority: "medium",
                url: "https://x.com/ozyphus/status/1951076843328827691"
              },
              {
                description: "Multi topic Deep Research",
                subTopic: "",
                priority: "medium",
                url: "https://ozyphus.notion.site/Deep-Research-23a9c546cc0c80bea84cd720c562f10d"
              }
            ],
            order: 11
          },
          {
            blockId: "1754202227998",
            blockTitle: "All About Agents",
            selectedItemIndices: [0, 1, 2, 3, 4],
            newItems: [],
            order: 12
          }
        ],
        createdAt: "2025-08-04T07:48:00.631Z",
        updatedAt: "2025-08-07T21:53:24.915Z"
      }
    ]
  };

  if (selectedCollection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <CollectionView
            collection={selectedCollection}
            allBlocks={data.blocks}
            onBack={() => setSelectedCollection(null)}
            studyProgress={studyProgress}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Learning Resources Hub
          </h1>
          <p className="text-xl text-gray-600 mb-8">Your comprehensive guide to mastering AI, ML, and beyond</p>
          
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setView('blocks')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                view === 'blocks'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
              All Blocks
            </button>
            <button
              onClick={() => setView('collections')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                view === 'collections'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
              }`}
            >
              <Star className="w-5 h-5" />
              Collections
            </button>
          </div>
        </div>

        {/* Content */}
        {view === 'blocks' ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">All Learning Blocks</h2>
              <p className="text-gray-600">Browse all available learning resources by topic</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.blocks
                .sort((a, b) => a.order - b.order)
                .map((block) => (
                  <BlockCard
                    key={block.id}
                    block={block}
                    onClick={() => {
                      // For blocks view, we'll show the first item as a demo
                      if (block.items.length > 0) {
                        setSelectedCard(block.items[0]);
                      }
                    }}
                  />
                ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Learning Collections</h2>
              <p className="text-gray-600">Curated learning paths with progress tracking</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {data.collections.map((collection) => {
                const progress = studyProgress.getCollectionProgress(collection);
                return (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    progress={progress}
                    onClick={() => setSelectedCollection(collection)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Card Popup */}
        {selectedCard && (
          <CardPopup
            item={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </div>
    </div>
  );
};

export default App;