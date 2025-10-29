import React, { useState, useEffect } from "react";
import { useSocket } from "../Context/SocketContext";
import { useAuth } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";

const CharacterCreator = ({ onSave }) => {
  const { user, refreshUser } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [character, setCharacter] = useState({
    face: user?.character?.face || "face1",
    accessories: user?.character?.accessories || [],
    name: user?.character?.name || "",
    colorScheme: user?.character?.colorScheme || "purple",
  });

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [userCoins, setUserCoins] = useState(user?.coinBalance || 0);
  const [unlockedItems, setUnlockedItems] = useState(user?.character?.unlockedItems || []);

  useEffect(() => {
    if (!socket) return;

    socket.on('character-saved', (data) => console.log('Character saved:', data));
    socket.on('purchase-result', (data) => {
      if (data.success) {
        console.log('Purchase successful:', data);
        setShowPurchaseModal(false);
        setSelectedItem(null);
        const newBalance = userCoins - selectedItem.price;
        setUserCoins(newBalance);
        const newUnlockedItems = [...unlockedItems, { itemId: selectedItem.id, purchasedAt: new Date(), price: selectedItem.price }];
        setUnlockedItems(newUnlockedItems);
        refreshUser();
        if (faces.find(f => f.id === selectedItem.id)) {
          setCharacter(prev => ({ ...prev, face: selectedItem.id }));
        } else {
          setCharacter(prev => ({ ...prev, accessories: [...prev.accessories, selectedItem.id] }));
        }
        alert(`🎉 Successfully purchased ${selectedItem.name}! You now own this item permanently.`);
      } else {
        if (!purchaseLoading) alert(`❌ Purchase failed: ${data.message}`);
      }
    });
    socket.on('character-data', (data) => {
      console.log('Received character data:', data);
      if (data.character) {
        setCharacter(prev => ({
          ...prev,
          ...data.character,
          face: data.character.face || prev.face,
          accessories: data.character.accessories || prev.accessories,
          name: data.character.name || prev.name,
          colorScheme: data.character.colorScheme || prev.colorScheme,
        }));
      }
      if (data.coinBalance !== undefined) setUserCoins(data.coinBalance);
      if (data.character?.unlockedItems) setUnlockedItems(data.character.unlockedItems);
    });

    socket.emit('get-character');

    return () => {
      socket.off('character-saved');
      socket.off('purchase-result');
      socket.off('character-data');
    };
  }, [socket]);

  useEffect(() => {
    if (user) {
      setUserCoins(user.coinBalance || 0);
      setUnlockedItems(user.character?.unlockedItems || []);
      if (!character.name && user.character?.name) {
        setCharacter(prev => ({
          ...prev,
          face: user.character.face || prev.face,
          accessories: user.character.accessories || prev.accessories,
          name: user.character.name || prev.name,
          colorScheme: user.character.colorScheme || prev.colorScheme,
        }));
      }
    }
  }, [user]);

  const faces = [
    { id: "face1", emoji: "😀", name: "Happy", price: 0, tier: "free" },
    { id: "face2", emoji: "😎", name: "Cool", price: 0, tier: "free" },
    { id: "face3", emoji: "🤠", name: "Cowboy", price: 100, tier: "common" },
    { id: "face4", emoji: "🧐", name: "Thinker", price: 100, tier: "common" },
    { id: "face5", emoji: "😈", name: "Mischievous", price: 300, tier: "epic" },
    { id: "face6", emoji: "👽", name: "Alien", price: 300, tier: "epic" },
    { id: "face7", emoji: "🤖", name: "Robot", price: 500, tier: "legendary" },
    { id: "face8", emoji: "😼", name: "Cat", price: 500, tier: "legendary" },
  ];

  const accessories = [
    { id: "glasses1", emoji: "👓", name: "Glasses", type: "glasses", price: 50, tier: "common", position: "top-2/5 left-1/2 transform -translate-x-1/2 -translate-y-2", scale: "text-3xl" },
    { id: "glasses2", emoji: "🕶️", name: "Sunglasses", type: "glasses", price: 100, tier: "common", position: "top-2/5 left-1/2 transform -translate-x-1/2 -translate-y-2", scale: "text-3xl" },
    { id: "hat1", emoji: "🧢", name: "Cap", type: "hat", price: 75, tier: "common", position: "top-0 left-1/2 transform -translate-x-1/2 -translate-y-4", scale: "text-4xl" },
    { id: "hat2", emoji: "🎩", name: "Top Hat", type: "hat", price: 200, tier: "epic", position: "top-0 left-1/2 transform -translate-x-1/2 -translate-y-6", scale: "text-4xl" },
    { id: "hat3", emoji: "👑", name: "Crown", type: "hat", price: 400, tier: "legendary", position: "top-0 left-1/2 transform -translate-x-1/2 -translate-y-5", scale: "text-3xl" },
    { id: "mask1", emoji: "😷", name: "Mask", type: "mask", price: 60, tier: "common", position: "top-1/2 left-1/2 transform -translate-x-1/2 translate-y-2", scale: "text-4xl" },
    { id: "mask2", emoji: "🎭", name: "Theater", type: "mask", price: 250, tier: "epic", position: "top-1/2 left-1/2 transform -translate-x-1/2 translate-y-1", scale: "text-5xl" },
    { id: "earring", emoji: "💎", name: "Earring", type: "ear", price: 150, tier: "epic", position: "top-1/2 right-6 transform translate-y-1", scale: "text-2xl" },
  ];

  const colorSchemes = [
    { id: "purple", name: "Solana Purple", gradient: "from-purple-500 to-pink-500", price: 0 },
    { id: "blue", name: "Ocean Blue", gradient: "from-blue-500 to-cyan-500", price: 0 },
    { id: "green", name: "Emerald", gradient: "from-green-500 to-teal-500", price: 0 },
    { id: "orange", name: "Sunset", gradient: "from-orange-500 to-red-500", price: 0 },
    { id: "indigo", name: "Royal", gradient: "from-indigo-500 to-purple-500", price: 0 },
  ];

  const isUnlocked = (itemId) => {
    if (!user) return false;
    const isPurchased = unlockedItems.some(item => item.itemId === itemId);
    if (isPurchased) return true;
    const item = [...faces, ...accessories].find(i => i.id === itemId);
    if (item?.price === 0) return true;
    if (itemId === "hat3" && user.gamesWon >= 10) return true;
    if (itemId === "face7" && user.gamesPlayed >= 25) return true;
    return false;
  };

  const canAfford = (price) => userCoins >= price;

  const handleFaceSelect = (face) => {
    if (isUnlocked(face.id) || face.price === 0) {
      setCharacter(prev => ({ ...prev, face: face.id }));
    } else {
      setSelectedItem(face);
      setShowPurchaseModal(true);
    }
  };

  const handleAccessoryToggle = (accessory) => {
    if (isUnlocked(accessory.id) || accessory.price === 0) {
      setCharacter((prev) => {
        const hasAccessory = prev.accessories.includes(accessory.id);
        if (hasAccessory) {
          return { ...prev, accessories: prev.accessories.filter((id) => id !== accessory.id) };
        } else {
          const filtered = prev.accessories.filter((id) => {
            const acc = accessories.find((a) => a.id === id);
            return !acc || acc.type !== accessory.type;
          });
          return { ...prev, accessories: [...filtered, accessory.id] };
        }
      });
    } else {
      setSelectedItem(accessory);
      setShowPurchaseModal(true);
    }
  };

  const handleColorSelect = (colorId) => setCharacter((prev) => ({ ...prev, colorScheme: colorId }));
  const handleNameChange = (e) => setCharacter((prev) => ({ ...prev, name: e.target.value }));

  const handlePurchase = async () => {
    if (!selectedItem || !user) return;

    setPurchaseLoading(true);
    try {
      if (socket) {
        socket.emit("purchase-item", {
          itemId: selectedItem.id,
          itemType: faces.find(f => f.id === selectedItem.id) ? "face" : "accessory",
          price: selectedItem.price,
          userId: user._id,
        });

        socket.once("purchase-result", (result) => {
          if (result.success) {
            setShowPurchaseModal(false);
            setSelectedItem(null);
            const newBalance = userCoins - selectedItem.price;
            setUserCoins(newBalance);
            const newUnlockedItems = [...unlockedItems, { itemId: selectedItem.id, purchasedAt: new Date(), price: selectedItem.price }];
            setUnlockedItems(newUnlockedItems);
            refreshUser();
            if (faces.find(f => f.id === selectedItem.id)) {
              setCharacter(prev => ({ ...prev, face: selectedItem.id }));
            } else {
              setCharacter(prev => ({ ...prev, accessories: [...prev.accessories, selectedItem.id] }));
            }
            alert(`🎉 Successfully purchased ${selectedItem.name}! You now own this item permanently.`);
          } else {
            alert(`❌ Purchase failed: ${result.message}`);
          }
          setPurchaseLoading(false);
        });
      }
    } catch (error) {
      console.error("Purchase error:", error);
      setPurchaseLoading(false);
    }
  };

  const handleSave = () => {
    if (!character.name.trim()) {
      alert("Please enter a character name!");
      return;
    }

    const characterData = {
      ...character,
      unlockedItems: unlockedItems
    };

    if (socket) {
      socket.emit("save-character", characterData);
      console.log("💾 Saving character:", characterData);
    }
    onSave && onSave(characterData);
    alert("✅ Character saved successfully!");
  };

  const getSelectedFace = () => faces.find((f) => f.id === character.face) || faces[0];
  const getSelectedColor = () => colorSchemes.find((c) => c.id === character.colorScheme) || colorSchemes[0];

  const goToStore = () => navigate("/store");

  const renderCharacterPreview = () => {
    const selectedFace = getSelectedFace();
    const selectedColor = getSelectedColor();
    
    const activeAccessories = character.accessories
      .map((id) => accessories.find((a) => a.id === id))
      .filter(Boolean);

    return (
      <div className="flex flex-col items-center relative">
        <div
          className={`bg-gradient-to-br ${selectedColor.gradient} rounded-full w-48 h-48 flex items-center justify-center relative mb-6 border-4 border-white shadow-2xl overflow-hidden`}
          style={{ position: 'relative', zIndex: 0 }}
        >
          <span
            className="text-8xl z-10 relative"
            style={{ position: 'relative', zIndex: 10 }}
          >
            {selectedFace.emoji}
          </span>
          
          {activeAccessories.map((acc) => (
            <span
              key={acc.id}
              className={`absolute ${acc.scale} z-5`}
              style={{
                ...parsePosition(acc.position),
                zIndex: acc.type === 'hat' ? 5 : 8,
              }}
            >
              {acc.emoji}
            </span>
          ))}
        </div>
        
        <h3 className="text-2xl font-bold text-center mb-2">{character.name || "Unnamed Hero"}</h3>
        <p className="text-gray-300 text-center">
          {selectedFace.name} • {selectedColor.name}
        </p>
        
        {activeAccessories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1 justify-center">
            {activeAccessories.map(acc => (
              <span key={acc.id} className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                {acc.emoji} {acc.name}
              </span>
            ))}
          </div>
        )}
        
        <div className="mt-2 flex gap-2">
          {selectedFace.tier !== "free" && (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              selectedFace.tier === "common" ? "bg-green-500" :
              selectedFace.tier === "epic" ? "bg-purple-500" :
              "bg-yellow-500"
            }`}>
              {selectedFace.tier.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    );
  };

  const parsePosition = (positionStr) => {
    const styles = {};
    positionStr.split(' ').forEach(part => {
      if (part.includes('top-')) styles.top = part.replace('top-', '') === '1/2' ? '50%' : part.replace('top-', '');
      if (part.includes('left-')) styles.left = part.replace('left-', '') === '1/2' ? '50%' : part.replace('left-', '');
      if (part.includes('right-')) styles.right = part.replace('right-', '');
      if (part.includes('transform')) {
        const transforms = part.split(' ').slice(1);
        styles.transform = transforms.join(' ');
      }
    });
    return styles;
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "common": return "border-green-500 bg-green-500/10";
      case "epic": return "border-purple-500 bg-purple-500/10";
      case "legendary": return "border-yellow-500 bg-yellow-500/10";
      default: return "border-gray-500";
    }
  };

  const isAccessoryEquipped = (accessoryId) => character.accessories.includes(accessoryId);

  return (
    <div className="max-w-6xl mx-auto p-4">
      {showPurchaseModal && selectedItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border-2 border-purple-500">
            <h3 className="text-2xl font-bold text-center mb-4">Purchase Item</h3>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{selectedItem.emoji}</div>
              <h4 className="text-xl font-bold">{selectedItem.name}</h4>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mt-2 ${
                selectedItem.tier === "common" ? "bg-green-500" :
                selectedItem.tier === "epic" ? "bg-purple-500" :
                "bg-yellow-500"
              }`}>
                {selectedItem.tier.toUpperCase()}
              </div>
              <p className="text-gray-300 text-sm mt-2">
                {selectedItem.type === 'face' ? 'Face' : 'Accessory'} • Permanent Ownership
              </p>
            </div>
            <div className="bg-gray-700 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg">Price:</span>
                <span className="text-2xl font-bold text-yellow-400">🪙 {selectedItem.price}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-lg">Your Coins:</span>
                <span className="text-xl font-bold text-yellow-300">🪙 {userCoins}</span>
              </div>
              <div className="mt-3 p-2 rounded bg-gray-600">
                <div className="text-sm text-center">
                  After purchase: <span className="font-bold text-yellow-300">🪙 {userCoins - selectedItem.price}</span>
                </div>
              </div>
            </div>
            {canAfford(selectedItem.price) ? (
              <div className="space-y-3">
                <button
                  onClick={handlePurchase}
                  disabled={purchaseLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 py-3 rounded-xl font-bold transition-all transform hover:scale-105 disabled:opacity-50"
                >
                  {purchaseLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Purchasing...
                    </div>
                  ) : (
                    `Buy Now for 🪙 ${selectedItem.price}`
                  )}
                </button>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 py-3 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-red-400 text-center font-bold py-2">
                  ❌ Not enough coins! Need 🪙 {selectedItem.price - userCoins} more
                </div>
                <button
                  onClick={goToStore}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 py-3 rounded-xl font-bold transition-all transform hover:scale-105"
                >
                  Buy More Coins
                </button>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 py-3 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          🎨 Character Creator
        </h1>
        <p className="text-xl text-gray-300">Design your ultimate gaming avatar!</p>
        <div className="flex justify-center items-center gap-4 mt-4">
          <div className="bg-gray-800 rounded-xl px-4 py-2 border border-yellow-500">
            <span className="text-yellow-400 font-bold text-lg">🪙 {userCoins.toLocaleString()} Coins</span>
          </div>
          <div className="bg-gray-800 rounded-xl px-4 py-2 border border-green-500">
            <span className="text-green-400 font-bold text-sm">🔓 {unlockedItems.length} Items Owned</span>
          </div>
          <button
            onClick={goToStore}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 px-4 py-2 rounded-xl font-bold transition-all transform hover:scale-105"
          >
            Buy More Coins
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 rounded-2xl p-8 border-2 border-purple-500">
          <h2 className="text-2xl font-bold mb-6 text-center">Character Preview</h2>
          {renderCharacterPreview()}
          <div className="mt-8">
            <label className="block text-sm font-medium mb-2">Character Name</label>
            <input
              type="text"
              value={character.name}
              onChange={handleNameChange}
              placeholder="Enter your character's name"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              maxLength={20}
            />
            <p className="text-sm text-gray-400 mt-2 text-right">
              {character.name.length}/20 characters
            </p>
          </div>
          <div className="mt-6 bg-gray-700 rounded-xl p-4">
            <h4 className="font-semibold mb-3">Current Equipment:</h4>
            <div className="flex flex-wrap gap-2">
              <span className="bg-purple-600 px-3 py-1 rounded-full text-sm">
                Face: {getSelectedFace().name}
              </span>
              {character.accessories.map(accId => {
                const acc = accessories.find(a => a.id === accId);
                return acc ? (
                  <span key={acc.id} className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                    {acc.emoji} {acc.name}
                  </span>
                ) : null;
              })}
              {character.accessories.length === 0 && (
                <span className="text-gray-400 text-sm">No accessories equipped</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 rounded-2xl p-6 border-2 border-blue-500">
            <h3 className="text-xl font-bold mb-4">Choose Your Face</h3>
            <div className="grid grid-cols-4 gap-4">
              {faces.map((face) => {
                const unlocked = isUnlocked(face.id);
                const canBuy = !unlocked && canAfford(face.price);
                const isSelected = character.face === face.id;
                
                return (
                  <button
                    key={face.id}
                    onClick={() => handleFaceSelect(face)}
                    className={`p-3 rounded-xl transition-all duration-200 border-2 relative overflow-hidden ${
                      isSelected
                        ? "bg-purple-600 border-purple-400 transform scale-105 shadow-lg"
                        : unlocked
                        ? "bg-gray-700 border-gray-600 hover:border-blue-500 hover:bg-gray-600 hover:shadow-md"
                        : canBuy
                        ? "bg-gray-700 border-yellow-500 hover:border-yellow-400 hover:bg-gray-600 hover:shadow-md"
                        : "bg-gray-800 border-gray-700 opacity-60"
                    } ${getTierColor(face.tier)}`}
                  >
                    <div className="text-3xl mb-2">{face.emoji}</div>
                    <div className="text-sm font-medium">{face.name}</div>
                    {!unlocked && face.price > 0 && (
                      <div className="text-xs mt-1">
                        <div className="text-yellow-400 font-bold">🪙 {face.price}</div>
                        {!canBuy && <div className="text-red-400">🔒</div>}
                      </div>
                    )}
                    {unlocked && (
                      <div className="text-xs mt-1 text-green-400">✔️ OWNED</div>
                    )}
                    {isSelected && (
                      <div className="absolute top-1 right-1 text-green-400">⭐</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 border-2 border-green-500">
            <h3 className="text-xl font-bold mb-4">Accessories</h3>
            <p className="text-sm text-gray-400 mb-3">
              Click to equip/unequip. Owned items can be used anytime!
            </p>
            <div className="grid grid-cols-4 gap-4">
              {accessories.map((accessory) => {
                const unlocked = isUnlocked(accessory.id);
                const canBuy = !unlocked && canAfford(accessory.price);
                const isEquipped = isAccessoryEquipped(accessory.id);
                
                return (
                  <button
                    key={accessory.id}
                    onClick={() => handleAccessoryToggle(accessory)}
                    className={`p-3 rounded-xl transition-all duration-200 border-2 relative ${
                      isEquipped
                        ? "bg-green-600 border-green-400 transform scale-105 shadow-lg"
                        : unlocked
                        ? "bg-gray-700 border-gray-600 hover:border-green-500 hover:bg-gray-600 hover:shadow-md"
                        : canBuy
                        ? "bg-gray-700 border-yellow-500 hover:border-yellow-400 hover:bg-gray-600 hover:shadow-md"
                        : "bg-gray-800 border-gray-700 opacity-60"
                    } ${getTierColor(accessory.tier)}`}
                    title={isEquipped ? "Click to unequip" : unlocked ? "Click to equip" : canBuy ? "Click to buy" : "Not enough coins"}
                  >
                    <div className="text-3xl mb-2">{accessory.emoji}</div>
                    <div className="text-sm font-medium">{accessory.name}</div>
                    {!unlocked && accessory.price > 0 && (
                      <div className="text-xs mt-1">
                        <div className="text-yellow-400 font-bold">🪙 {accessory.price}</div>
                        {!canBuy && <div className="text-red-400">🔒</div>}
                      </div>
                    )}
                    {unlocked && (
                      <div className="text-xs mt-1 text-green-400">
                        {isEquipped ? "✅ EQUIPPED" : "✔️ OWNED"}
                      </div>
                    )}
                    {isEquipped && (
                      <div className="absolute top-1 right-1 text-white bg-green-500 rounded-full w-4 h-4 flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 border-2 border-yellow-500">
            <h3 className="text-xl font-bold mb-4">Color Scheme</h3>
            <div className="grid grid-cols-5 gap-4">
              {colorSchemes.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleColorSelect(color.id)}
                  className={`p-4 rounded-xl transition-all duration-200 border-2 ${
                    character.colorScheme === color.id
                      ? "border-yellow-400 transform scale-105 shadow-lg"
                      : "border-gray-600 hover:border-yellow-500 hover:shadow-md"
                  } bg-gradient-to-br ${color.gradient}`}
                  title={color.name}
                >
                  <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 mx-auto"></div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={!character.name.trim()}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg"
            >
              💾 Save Character
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-800 rounded-2xl p-6 border-2 border-indigo-500">
        <h3 className="text-xl font-bold mb-4 text-center">🎯 Your Collection</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-gray-700 rounded-lg p-4 border border-purple-500">
            <div className="text-2xl mb-2">🪙</div>
            <p className="font-semibold">{userCoins} Coins</p>
            <p className="text-sm text-gray-400">Available balance</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 border border-green-500">
            <div className="text-2xl mb-2">🔓</div>
            <p className="font-semibold">{unlockedItems.length} Items Owned</p>
            <p className="text-sm text-gray-400">Permanent collection</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 border border-yellow-500">
            <div className="text-2xl mb-2">⭐</div>
            <p className="font-semibold">{character.accessories.length} Equipped</p>
            <p className="text-sm text-gray-400">Currently wearing</p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gray-800 rounded-2xl p-6 border-2 border-gray-600">
        <h3 className="text-xl font-bold mb-4 text-center">Tier System</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">⚪</div>
            <p className="font-semibold">FREE</p>
            <p className="text-sm text-gray-400">Available to all players</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 border border-green-500">
            <div className="text-2xl mb-2">🟢</div>
            <p className="font-semibold">COMMON</p>
            <p className="text-sm text-gray-400">50-100 coins</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 border border-purple-500">
            <div className="text-2xl mb-2">🟣</div>
            <p className="font-semibold">EPIC</p>
            <p className="text-sm text-gray-400">150-300 coins</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 border border-yellow-500">
            <div className="text-2xl mb-2">🟡</div>
            <p className="font-semibold">LEGENDARY</p>
            <p className="text-sm text-gray-400">400-500 coins</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreator;