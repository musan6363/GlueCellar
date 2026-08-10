import React, { useState, useRef } from 'react';
import { WineCard, TasteLevel, DEFAULT_TASTES } from '../types';
import { Wine, ImagePlus, Trash2, Star, Barcode, Image as ImageIcon, Camera } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const WineBottle = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2v5a3 3 0 0 0-2 3v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V10a3 3 0 0 0-2-3V2z" />
    <path d="M8.5 15h7" />
    <path d="M10 2h4" />
  </svg>
);

interface Props {
  initialData?: Partial<WineCard>;
  onSave: (data: Partial<WineCard>) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export const WineCardForm: React.FC<Props> = ({ initialData, onSave, onDelete, onCancel }) => {
  const [card, setCard] = useState<Partial<WineCard>>({
    name: '',
    country: '',
    grapes: '',
    glassCount: 0,
    bottleCount: 0,
    rating5: 0,
    tastes: {},
    memo: '',
    images: [],
    janCode: '',
    ...initialData
  });

  // メニューの開閉状態と、ファイル入力用の参照（Ref）
  const [showImageMenu, setShowImageMenu] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleTasteToggle = (taste: string) => {
    setCard(prev => {
      const currentLevel = prev.tastes?.[taste] || 0;
      const nextLevel = ((currentLevel + 1) % 3) as TasteLevel;
      return { ...prev, tastes: { ...prev.tastes, [taste]: nextLevel } };
    });
  };

  const updateCount = (type: 'glass' | 'bottle', delta: number) => {
    setCard(prev => {
      const current = type === 'glass' ? (prev.glassCount || 0) : (prev.bottleCount || 0);
      return { ...prev, [type === 'glass' ? 'glassCount' : 'bottleCount']: Math.max(0, current + delta) };
    });
  };

  // -------------------------
  // メニュー操作と画像アップロード処理
  // -------------------------
  const [showScanner, setShowScanner] = useState(false);

  const startScanner = () => {
    setShowImageMenu(false);
    setShowScanner(true);
    
    // カメラ起動処理
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { fps: 10, qrbox: { width: 250, height: 100 } },
      /* verbose= */ false
    );

    scanner.render((decodedText) => {
      setCard({ ...card, janCode: decodedText });
      setShowScanner(false);
      scanner.clear();
    }, (err) => {
      // 読み取りエラー
    });
  };

  const handleBarcodeClick = () => {
    startScanner();
  };

  const handleGalleryClick = () => {
    setShowImageMenu(false);
    galleryInputRef.current?.click();
  };

  const handleCameraClick = () => {
    setShowImageMenu(false);
    cameraInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const currentImages = card.images || [];
        if (currentImages.length < 2) {
          setCard({ ...card, images: [...currentImages, base64] });
        } else {
          alert('登録できる画像は2枚までです');
        }
      };
      reader.readAsDataURL(file);
    }
    // 同じファイルを選び直せるように入力をリセット
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = (card.images || []).filter((_, i) => i !== index);
    setCard({ ...card, images: newImages });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-craft-paper p-6 relative flex flex-col gap-4 text-gray-800 border-t-[12px] border-[#eaddcf] shadow-xl h-[85vh] overflow-y-auto">
      {/* 隠しファイル入力（ReactのRefを利用してボタンから呼び出します） */}
      <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleImageUpload} className="hidden" />
      <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleImageUpload} className="hidden" />

      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#eaddcf] opacity-80 rotate-[-2deg]"></div>

      {/* ヘッダー情報 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
          <span className="text-sm font-bold opacity-70">Name</span>
          <input 
            type="text" 
            className="flex-1 bg-transparent outline-none text-3xl font-bold"
            placeholder="ワイン名"
            value={card.name}
            onChange={e => setCard({...card, name: e.target.value})}
          />
        </div>
        
        <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
          <span className="text-sm font-bold opacity-70">Country</span>
          <input 
            type="text" 
            className="flex-1 bg-transparent outline-none text-xl"
            placeholder="原産国"
            value={card.country}
            onChange={e => setCard({...card, country: e.target.value})}
          />
        </div>

        <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
          <span className="text-sm font-bold opacity-70">Grapes</span>
          <input 
            type="text" 
            className="flex-1 bg-transparent outline-none text-xl"
            placeholder="ブドウ品種"
            value={card.grapes}
            onChange={e => setCard({...card, grapes: e.target.value})}
          />
        </div>

        {/* JANコードが登録されている場合のみ表示 */}
        {card.janCode && (
          <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
            <span className="text-sm font-bold opacity-70">JAN</span>
            <span className="flex-1 bg-transparent outline-none text-lg font-mono tracking-widest">{card.janCode}</span>
          </div>
        )}
      </div>

      {/* 評価と飲用回数カウンター */}
      <div className="flex flex-wrap gap-y-3 justify-between items-center my-3 border-b border-gray-400/50 pb-3">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setCard({ ...card, rating5: card.rating5 === star ? 0 : star })}
              className={`p-1 transition-colors ${star <= (card.rating5 || 0) ? 'text-orange-700' : 'text-gray-400'}`}
            >
              <Star size={20} strokeWidth={1.5} fill={star <= (card.rating5 || 0) ? "currentColor" : "none"} />
            </button>
          ))}
        </div>

        <div className="flex gap-3 sm:gap-4 items-center ml-auto">
          <div className="flex items-center gap-1">
            <WineBottle size={18} />
            <button onClick={() => updateCount('bottle', -1)} className="px-2 border border-gray-500 rounded-full">-</button>
            <span className="text-lg w-4 text-center">{card.bottleCount}</span>
            <button onClick={() => updateCount('bottle', 1)} className="px-2 border border-gray-500 rounded-full">+</button>
          </div>
          <div className="flex items-center gap-1">
            <Wine size={18} />
            <button onClick={() => updateCount('glass', -1)} className="px-2 border border-gray-500 rounded-full">-</button>
            <span className="text-lg w-4 text-center">{card.glassCount}</span>
            <button onClick={() => updateCount('glass', 1)} className="px-2 border border-gray-500 rounded-full">+</button>
          </div>
        </div>
      </div>

      {/* Tastes */}
      <div>
        <span className="text-sm font-bold opacity-70 block mb-2">Tastes</span>
        <div className="grid grid-cols-4 gap-x-2 gap-y-4 text-center text-sm">
          {DEFAULT_TASTES.map(taste => {
            const level = card.tastes?.[taste] || 0;
            return (
              <button
                key={taste}
                onClick={() => handleTasteToggle(taste)}
                className={`py-1 px-1 taste-oval transition-all ${
                  level === 0 ? 'border border-transparent' :
                  level === 1 ? 'border-2 border-dashed border-gray-700' :
                  'border-2 border-solid border-gray-800 font-bold'
                }`}
              >
                {taste}
              </button>
            );
          })}
        </div>
      </div>

      {/* Memo */}
      <div className="mt-4 border border-gray-400 p-2 relative">
        <span className="absolute -top-3 left-2 bg-transparent text-sm font-bold opacity-70 bg-[#d4c4b7] px-1">memo</span>
        <textarea 
          className="w-full bg-transparent outline-none resize-none min-h-[100px] mt-2 leading-relaxed"
          placeholder="味わいの感想やメモ..."
          value={card.memo}
          onChange={e => setCard({...card, memo: e.target.value})}
        />
      </div>

      {/* 追加された画像のサムネイル表示 */}
      {(card.images && card.images.length > 0) && (
        <div className="flex gap-4 mt-2">
          {card.images.map((img, i) => (
            <div key={i} className="relative">
              <img src={img} alt={`wine-${i}`} className="w-20 h-20 object-cover border border-gray-500 rounded shadow-sm" />
              <button 
                onClick={() => removeImage(i)} 
                className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 shadow hover:bg-red-700"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex justify-between items-center mt-4 pb-4">
        <div className="flex gap-2">
          {onDelete && (
            <button onClick={onDelete} className="p-2 text-red-800/70 hover:bg-red-800/10 rounded">
              <Trash2 size={24} />
            </button>
          )}
          
          {/* 画像追加メニュー */}
          <div className="relative">
            <button 
              onClick={() => setShowImageMenu(!showImageMenu)}
              className="p-2 text-gray-700 hover:bg-gray-800/10 rounded bg-[#c2b2a3]/30"
            >
              <ImagePlus size={24} />
            </button>

            {/* バーコードスキャナーモーダル */}
            {showScanner && (
              <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
                <div id="reader" className="w-full max-w-sm bg-white"></div>
                <button 
                  onClick={() => { setShowScanner(false); window.location.reload(); }} 
                  className="mt-4 px-6 py-2 bg-red-600 text-white rounded"
                >
                  キャンセル
                </button>
              </div>
            )}
            
            {showImageMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-white border border-gray-300 rounded shadow-lg text-sm z-10 overflow-hidden font-sans">
                <button onClick={handleBarcodeClick} className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 border-b border-gray-200">
                  <Barcode size={18} /> バーコードを記録
                </button>
                <button onClick={handleGalleryClick} className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 border-b border-gray-200">
                  <ImageIcon size={18} /> フォルダから選ぶ
                </button>
                <button onClick={handleCameraClick} className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3">
                  <Camera size={18} /> カメラで撮る
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-800/10 rounded font-bold">
            閉じる
          </button>
          <button onClick={() => onSave(card)} className="px-6 py-2 bg-gray-800 text-white rounded font-bold shadow">
            保存する
          </button>
        </div>
      </div>
    </div>
  );
};
