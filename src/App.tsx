// src/App.tsx の実装
import React, { useState } from 'react';
import { WineCardForm } from './components/WineCardForm';
import { Menu, Plus, Wine } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { WineCard, DEFAULT_TASTES } from './types'; // DEFAULT_TASTES を追加

// ギャラリー表示用のボトルアイコン
const WineBottle = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2v5a3 3 0 0 0-2 3v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V10a3 3 0 0 0-2-3V2z" />
    <path d="M8.5 15h7" />
    <path d="M10 2h4" />
  </svg>
);

function App() {
  const [view, setView] = useState<'gallery' | 'form'>('gallery');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 現在編集中のカードデータを保持するState
  const [editingCard, setEditingCard] = useState<Partial<WineCard> | undefined>(undefined);

  // DBからワインカード一覧を取得
  const cards = useLiveQuery(() => db.wineCards.toArray()) || [];

  const handleSave = async (data: Partial<WineCard>) => {
    try {
      const newCard = {
        ...data,
        id: data.id || crypto.randomUUID(),
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as WineCard;

      await db.wineCards.put(newCard);
      setView('gallery');
      setEditingCard(undefined); // 保存後に編集状態をリセット
    } catch (error) {
      console.error("保存に失敗しました", error);
      alert("保存に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('本当にこの記録を削除しますか？')) {
      await db.wineCards.delete(id);
      setView('gallery');
      setEditingCard(undefined);
    }
  };

  // ギャラリーのカードをタップした時の処理
  const handleCardClick = (card: WineCard) => {
    setEditingCard(card);
    setView('form');
  };

  // 新規追加ボタン（＋）を押した時の処理
  const handleAddNew = () => {
    setEditingCard(undefined); // 新規なので空にする
    setView('form');
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#2a2a2a]">
      {/* Header */}
      <header className="p-4 flex justify-between items-center z-10 text-white relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <Menu size={28} />
        </button>
        <h1 className="text-xl font-bold tracking-widest font-sans">GLUE CELLAR</h1>
        <div className="w-10"></div>

        {/* 簡易ハンバーガーメニュー */}
        {isMenuOpen && (
          <div className="absolute top-16 left-4 bg-white text-black p-4 rounded shadow-lg z-50 min-w-[200px]">
            <ul className="space-y-4">
              <li className="font-bold border-b pb-2">メニュー</li>
              <li className="cursor-pointer hover:text-orange-800">検索 (準備中)</li>
              <li className="cursor-pointer hover:text-orange-800">エクスポート (準備中)</li>
              <li className="cursor-pointer hover:text-orange-800">インポート (準備中)</li>
            </ul>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full flex items-center justify-center p-4">
        {view === 'form' ? (
          <WineCardForm
            initialData={editingCard}
            onSave={handleSave}
            // 既存データのときだけ削除関数を渡す。新規作成時はundefinedを渡してゴミ箱を非表示にする
            onDelete={editingCard?.id ? () => handleDelete(editingCard.id!) : undefined}
            // キャンセルされたらギャラリーに戻り、編集状態をクリアする
            onCancel={() => {
              setView('gallery');
              setEditingCard(undefined);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center overflow-x-auto snap-x snap-mandatory cover-flow-container gap-8 px-[10vw]">
            {cards.length === 0 ? (
              <div className="text-white text-center w-full opacity-60 flex flex-col items-center">
                <Wine size={48} className="mb-4" />
                <p>まだ記録がありません。<br />右下の「＋」から追加してください。</p>
              </div>
            ) : (
              cards.map((card) => (
                <div
                  key={card.id}
                  className="snap-center shrink-0 w-[85vw] max-w-[400px] cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => handleCardClick(card)}
                >
                  {/* ギャラリー用の読み取り専用プレビューカード（見た目はフォームと完全一致） */}
                  <div className="bg-craft-paper p-6 relative flex flex-col gap-4 text-gray-800 border-t-[12px] border-[#eaddcf] shadow-xl h-[70vh] overflow-y-auto">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#eaddcf] opacity-80 rotate-[-2deg]"></div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
                        <span className="text-sm font-bold opacity-70">Name</span>
                        <span className="flex-1 text-3xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">{card.name || ' '}</span>
                      </div>
                      <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
                        <span className="text-sm font-bold opacity-70">Country</span>
                        <span className="flex-1 text-xl">{card.country || ' '}</span>
                      </div>
                      <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
                        <span className="text-sm font-bold opacity-70">Grapes</span>
                        <span className="flex-1 text-xl">{card.grapes || ' '}</span>
                      </div>
                    </div>

                    <div className="flex gap-6 justify-end items-center my-2">
                      <div className="flex items-center gap-2">
                        <WineBottle size={18} />
                        <span className="text-lg w-4 text-center">{card.bottleCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wine size={18} />
                        <span className="text-lg w-4 text-center">{card.glassCount || 0}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-bold opacity-70 block mb-2">Tastes</span>
                      <div className="grid grid-cols-4 gap-x-2 gap-y-4 text-center text-sm">
                        {DEFAULT_TASTES.map(taste => {
                          const level = card.tastes?.[taste] || 0;
                          return (
                            <div
                              key={taste}
                              className={`py-1 px-1 taste-oval ${level === 0 ? 'border border-transparent opacity-50' :
                                  level === 1 ? 'border-2 border-dashed border-gray-700' :
                                    'border-2 border-solid border-gray-800 font-bold'
                                }`}
                            >
                              {taste}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 border border-gray-400 p-2 relative min-h-[100px]">
                      <span className="absolute -top-3 left-2 bg-transparent text-sm font-bold opacity-70 bg-[#d4c4b7] px-1">memo</span>
                      <div className="mt-2 leading-relaxed whitespace-pre-wrap">{card.memo}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* FAB */}
      {view === 'gallery' && (
        <button
          onClick={handleAddNew}
          className="absolute bottom-8 right-8 bg-orange-800 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-20"
        >
          <Plus size={32} />
        </button>
      )}
    </div>
  );
}

export default App;
