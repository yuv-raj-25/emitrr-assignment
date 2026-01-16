type CellValue = 0 | 1 | 2;

type BoardProps = {
  board: CellValue[][];
  onColumnClick: (columnIndex: number) => void;
  disabled?: boolean;
};

const Board = ({
  board,
  onColumnClick,
  disabled = false,
}: BoardProps) => {
  const rows = board.length;
  const columns = board[0]?.length ?? 0;

  return (
    <div className="board">
      {Array.from({ length: columns }).map((_, columnIndex) => (
        <button
          key={columnIndex}
          className="column-button"
          onClick={() => onColumnClick(columnIndex)}
          disabled={disabled}
          type="button"
          aria-label={`Column ${columnIndex + 1}`}
        >
          {Array.from({ length: rows }).map((_, rowIndex) => {
            const value = board[rowIndex]?.[columnIndex] ?? 0;
            return (
              <div
                key={`${rowIndex}-${columnIndex}`}
                className={`cell ${
                  value === 1
                    ? "cell--p1"
                    : value === 2
                    ? "cell--p2"
                    : ""
                }`}
              />
            );
          })}
        </button>
      ))}
    </div>
  );
};

export default Board;
