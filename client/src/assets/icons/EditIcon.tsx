import { useContext } from "react";
import { AppContext } from "@app/pages/App";
import { AppContextShape, Review } from "@app/types/types";

interface EditIconProps {
  color?: string;
  size: number;
  review?: Review;
}

const EditIcon = (props: EditIconProps) => {
  const { size, color, review } = props;
  const { isDarkMode, setIsReviewEditorOpen, setSelectedReviewId } = useContext(
    AppContext
  ) as AppContextShape;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="cursor-pointer"
      onClick={() => {
        if (review) {
          setSelectedReviewId(review.id);
          setIsReviewEditorOpen(true);
        }
      }}
    >
      <path
        d="M14.06 9L15 9.94L5.92 19H5V18.08L14.06 9ZM17.66 3C17.41 3 17.15 3.1 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04C21.1 6.65 21.1 6 20.71 5.63L18.37 3.29C18.17 3.09 17.92 3 17.66 3ZM14.06 6.19L3 17.25V21H6.75L17.81 9.94L14.06 6.19Z"
        fill={isDarkMode ? "white" : color ? color : "#2C2C2C"}
      />
    </svg>
  );
};

export default EditIcon;
