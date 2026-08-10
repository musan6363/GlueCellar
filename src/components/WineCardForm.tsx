import React, { useState } from 'react';
import { WineCard, TasteLevel, DEFAULT_TASTES } from '../types';
import { Wine, ImagePlus, Trash2, Star } from 'lucide-react'; // GlassWaterを削除済み

// ワインボトルアイコン（追加済み）
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
  onCancel: () => void; // ← 新規追加
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
    ...initialData
  });

  const handleTasteToggle = (taste: string) => {
    setCard(prev => {
      const currentLevel = prev.tastes?.[taste] || 0;
      const nextLevel = ((currentLevel + 1) % 3) as TasteLevel;
      return {
        ...prev,
        tastes: { ...prev.tastes, [taste]: nextLevel }
      };
    });
  };

  const updateCount = (type: 'glass' | 'bottle', delta: number) => {
    setCard(prev => {
      const current = type === 'glass' ? (prev.glassCount || 0) : (prev.bottleCount || 0);
      const next = Math.max(0, current + delta);
      return { ...prev, [type === 'glass' ? 'glassCount' : 'bottleCount']: next };
    });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-craft-paper p-6 relative flex flex-col gap-4 text-gray-800 border-t-[12px] border-[#eaddcf] shadow-xl h-[85vh] overflow-y-auto">
      {/* マスキングテープ */}
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
      </div>

      {/* 評価と飲用回数カウンター */}
      <div className="flex flex-wrap gap-y-3 justify-between items-center my-3 border-b border-gray-400/50 pb-3">
        {/* 左側：5段階評価 */}
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setCard({ ...card, rating5: card.rating5 === star ? 0 : star })}
              className={`p-1 transition-colors ${
                star <= (card.rating5 || 0)
                  ? 'text-orange-700'
                  : 'text-gray-400'
              }`}
            >
              <Star size={20} strokeWidth={1.5} fill={star <= (card.rating5 || 0) ? "currentColor" : "none"} />
            </button>
          ))}
        </div>

        {/* 右側：ボトルとグラスの回数 */}
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

      {/* アクションボタン */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex gap-3">
          {/* onDeleteが渡されている（＝既存データ）時のみゴミ箱を表示 */}
          {onDelete && (
            <button onClick={onDelete} className="p-2 text-red-800/70 hover:bg-red-800/10 rounded">
              <Trash2 size={24} />
            </button>
          )}
          <button className="p-2 text-gray-700 hover:bg-gray-800/10 rounded">
            <ImagePlus size={24} />
          </button>
        </div>
        <div className="flex gap-3">
          {/* キャンセルボタンを追加 */}
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-800/10 rounded font-bold"
          >
            閉じる
          </button>
          <button 
            onClick={() => onSave(card)}
            className="px-6 py-2 bg-gray-800 text-white rounded font-bold shadow"
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
};
