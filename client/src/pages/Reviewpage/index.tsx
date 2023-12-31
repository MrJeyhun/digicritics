import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  commentReview,
  getCommentsForReview,
  getReviewById,
  getSimilarReviews,
  likeReview,
  rateReview,
} from "@app/api/reviews";
import socket from "@app/api/socket";
import AvatarIcon from "@app/assets/icons/AvatarIcon";
import HeartIcon from "@app/assets/icons/HeartIcon";
import CardSpinner from "@app/components/CardSpinner";
import CommentsSpinner from "@app/components/CommentsSpinner";
import ImageSlider from "@app/components/ImageSlider";
import Loader from "@app/components/Loader";
import ReviewCard from "@app/components/ReviewCard";
import useError from "@app/hooks/useError";
import useGetConfig from "@app/hooks/useGetConfig";
import { queryClient } from "@app/index";
import Layout from "@app/layout/AppLayout";
import { Routes } from "@app/router/rooter";
import { LikeAction } from "@app/types/enums";
import {
  AppContextShape,
  Comment,
  CommentsData,
  CommentsSocketData,
  ReviewsData,
} from "@app/types/types";
import { calculateAverageRate, classNames, dateFormatter } from "@app/utils";
import { useAuth0 } from "@auth0/auth0-react";
import { Rating } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppContext } from "../App";

const ReviewPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { onError } = useError();
  const { config } = useGetConfig();
  const { isAuthenticated } = useAuth0();

  const { loggedUserId, isDarkMode } = useContext(
    AppContext
  ) as AppContextShape;

  const [ratingValue, setRatingValue] = useState<number>(0);
  const [currentUserRating, setCurrentUserRating] = useState<number | null>();
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);

  const { data: reviewData, isLoading: isReviewByIdLoading } =
    useQuery<ReviewsData>(
      ["reviewById", id],
      () => {
        if (id) {
          return getReviewById(id);
        } else {
          return Promise.resolve([]);
        }
      },
      {
        onError,
        retry: false,
      }
    );

  const { data: commentsForReviewData, isLoading: isCommentsForReviewLoading } =
    useQuery<CommentsData>(
      ["comments", id],
      () => {
        if (id) {
          return getCommentsForReview(id);
        } else {
          return Promise.resolve([]);
        }
      },
      {
        onError,
        retry: false,
      }
    );

  const { data: similarReviewsData, isLoading: isSimilarReviewsLoading } =
    useQuery<ReviewsData[]>(
      ["similarReviews", id],
      () => {
        if (id) {
          return getSimilarReviews(+id);
        } else {
          return Promise.resolve([]);
        }
      },
      {
        onError,
        retry: false,
      }
    );

  const { mutate: likeReviewMutate, isLoading: isLikeReviewLoading } =
    useMutation(likeReview, {
      onSuccess: (response: { message: string; action: LikeAction }) => {
        queryClient.invalidateQueries(["reviews"]);
        queryClient.invalidateQueries(["users"]);
        queryClient.invalidateQueries(["reviewById"]);
        queryClient.invalidateQueries(["userById"]);
        queryClient.invalidateQueries(["similarReviews"]);

        if (response.action === LikeAction.LIKED) {
          setLiked(true);
        } else if (response.action === LikeAction.UNLIKED) {
          setLiked(false);
        }
      },
      onError,
    });

  const { mutate: rateReviewMutate, isLoading: isRateReviewLoading } =
    useMutation(rateReview, {
      onSuccess: () => {
        queryClient.invalidateQueries(["reviews"]);
        queryClient.invalidateQueries(["users"]);
        queryClient.invalidateQueries(["reviewById"]);
        queryClient.invalidateQueries(["userById"]);
        queryClient.invalidateQueries(["similarReviews"]);
        queryClient.invalidateQueries(["similarReviews"]);
      },
      onError,
    });

  const { mutate: commentReviewMutate, isLoading: isCommentReviewLoading } =
    useMutation(commentReview, {
      onSuccess: () => {
        setComment("");
        queryClient.invalidateQueries(["reviews"]);
        queryClient.invalidateQueries(["users"]);
        queryClient.invalidateQueries(["reviewById"]);
        queryClient.invalidateQueries(["userById"]);
        queryClient.invalidateQueries(["comments"]);
      },
      onError,
    });

  useEffect(() => {
    if (reviewData) {
      if (reviewData?.likes.length) {
        reviewData.likes.forEach((like) => {
          if (like.userId === loggedUserId) {
            setLiked(true);
          } else {
            setLiked(false);
          }
        });
      } else {
        setLiked(false);
      }

      setRatingValue(calculateAverageRate(reviewData.ratings));
    }
  });

  useEffect(() => {
    commentsForReviewData && setComments(commentsForReviewData.comments);
  }, [commentsForReviewData]);

  useEffect(() => {
    const getCommentsListener = (data: CommentsSocketData) => {
      const { newComment } = data;

      if (id && newComment.reviewId === +id) {
        setComments((prevComments) => [newComment, ...prevComments]);
      }
    };

    socket.on("getComments", getCommentsListener);

    return () => {
      socket.off("getComments", getCommentsListener);
    };
  }, []);

  const handleLike = () => {
    if (reviewData && loggedUserId && config && !isLikeReviewLoading) {
      likeReviewMutate({
        userId: loggedUserId,
        reviewId: reviewData.id,
        config,
      });
    }
  };

  const handleRate = (rating: number) => {
    if (loggedUserId && reviewData && config && !isRateReviewLoading) {
      rateReviewMutate({
        userId: loggedUserId,
        reviewId: reviewData?.id,
        rating,
        config,
      });
    }
  };

  const handleAddComment = () => {
    if (comment && config && id && loggedUserId) {
      commentReviewMutate({
        reviewId: id,
        userId: loggedUserId,
        content: comment,
        config: config,
      });
    }
  };

  return (
    <Layout>
      {isReviewByIdLoading ? (
        <div className="flex h-[91vh] w-full items-center justify-center dark:bg-[#1B1B1B]">
          <Loader />
        </div>
      ) : (
        reviewData && (
          <div className="h-full min-h-[91vh] w-full p-20 dark:bg-[#1B1B1B]">
            <div>
              <ImageSlider images={reviewData.reviewImages} />
            </div>
            <div>
              <div className="relative flex justify-between max-[600px]:flex-col">
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="like review"
                  onClick={(e) => {
                    if (isAuthenticated) {
                      e.preventDefault();
                      handleLike();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (isAuthenticated) {
                      e.preventDefault();
                      handleLike();
                    }
                  }}
                  className={classNames(
                    "absolute right-0 top-4 flex items-center max-[450px]:static",
                    isAuthenticated ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  <span className="mr-1 text-2xl text-[#2C2C2C] dark:text-white max-[600px]:text-[20px]">
                    {reviewData?.likes.length}
                  </span>
                  <HeartIcon
                    size={24}
                    liked={liked}
                    setLiked={setLiked}
                    color={isDarkMode ? "white" : "#2C2C2C"}
                  />
                </div>
                <div className="flex max-w-[90%] break-all text-left text-[40px] font-semibold leading-[52px]	dark:text-white max-[600px]:text-[24px]">
                  {reviewData.reviewTitle}
                </div>
              </div>
              <div className="mb-4 flex justify-between">
                <span className="text-[32px] font-medium dark:text-white max-[600px]:text-[20px]">
                  {reviewData.workName}
                </span>
              </div>
              <div className="mb-3 flex justify-start text-2xl max-[600px]:text-base">
                <span className="font-medium	 dark:text-white">
                  {`${t("Review.category")}:`}
                </span>
                <span className="ml-1 dark:text-white max-[600px]:text-base">
                  {reviewData?.category?.name}
                </span>
              </div>
              <div className="mb-3 flex justify-start text-2xl max-[600px]:text-base">
                <span className="font-medium	 dark:text-white">
                  {`${t("Review.tags")}:`}
                </span>
                <span className="ml-1 dark:text-white">
                  {reviewData?.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="ml-1 dark:text-white"
                    >{`#${tag.name}`}</span>
                  ))}
                </span>
              </div>
              <div className="mb-2 flex">
                <div className="flex justify-start text-2xl max-[600px]:text-base">
                  <span className="font-medium dark:text-white">
                    {`${t("Review.createdby")}:`}
                  </span>
                  <Link to={`${Routes.profile}/${reviewData.userId}`}>
                    <span className="ml-1 dark:text-white">
                      {reviewData.user.fullName}
                    </span>
                  </Link>
                </div>
                <div className="ml-4 self-end text-base text-[#717171] dark:text-[#9C9C9C] max-[600px]:text-[10px]">
                  {dateFormatter(reviewData?.createdTime)}
                </div>
              </div>
              <div className="flex min-[320px]:flex-col min-[320px]:space-y-3 sm:justify-between">
                <div className="flex">
                  <Rating
                    sx={isDarkMode ? { stroke: "#eab305" } : {}}
                    name="simple-controlled"
                    value={currentUserRating ? currentUserRating : ratingValue}
                    size="large"
                    disabled={!isAuthenticated}
                    onChange={(e, newValue) => {
                      if (newValue) {
                        setCurrentUserRating(newValue);
                        handleRate(newValue);
                      }
                    }}
                  />
                  <span className="ml-4 self-center dark:text-white">
                    {currentUserRating
                      ? currentUserRating
                      : ratingValue
                      ? ratingValue
                      : null}
                  </span>
                  <div className="ml-6 self-center text-base text-[#717171] dark:text-[#9C9C9C]">
                    {reviewData?.ratings.length
                      ? `${reviewData?.ratings.length} ${t("Review.ratings")}`
                      : null}
                  </div>
                </div>
              </div>
              <p className="mt-[38px] text-left dark:text-white max-[600px]:text-[14px]">
                {reviewData.reviewContent}
              </p>
            </div>
            <div className="flex w-full flex-col">
              {similarReviewsData?.length ? (
                <>
                  <div className="mt-40 flex items-start text-2xl dark:text-white">
                    {t("Review.similarReviews")}
                  </div>
                  <div className="mt-6 grid grid-cols-4 gap-4">
                    {isSimilarReviewsLoading
                      ? Array.from({ length: 4 }).map((item, index) => (
                          <CardSpinner key={index} />
                        ))
                      : similarReviewsData?.map((review: ReviewsData) => (
                          <Link
                            key={review.id}
                            to={`${Routes.reviewpage}/${review.id}`}
                          >
                            <ReviewCard review={review} />
                          </Link>
                        ))}
                  </div>
                </>
              ) : null}
            </div>
            <div className="mt-20 flex items-start text-2xl dark:text-white">
              {t("Review.comments")}
            </div>
            {isAuthenticated && (
              <>
                <div className="mt-6">
                  <textarea
                    placeholder={t("Review.yourComment")}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddComment();
                      }
                    }}
                    disabled={isCommentReviewLoading}
                    className="h-[115px] w-full rounded-[6px] border border-solid border-[#044D69] bg-[transparent] placeholder:text-black dark:border-[#DEDEDE] dark:text-white dark:placeholder:text-white"
                  ></textarea>
                </div>
                <div className="my-4 flex justify-end">
                  <button
                    type="button"
                    disabled={isCommentReviewLoading}
                    onClick={handleAddComment}
                    className="flex h-[48px] w-fit items-center justify-center rounded-md bg-gradientBtnBlue px-4 py-[10px] text-base font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    {t("Review.postComment")}
                  </button>
                </div>
              </>
            )}
            <div className="mt-10 flex flex-col">
              {isCommentsForReviewLoading ? (
                <>
                  <CommentsSpinner />
                  <CommentsSpinner />
                </>
              ) : comments?.length ? (
                comments?.map((comment) => (
                  <div
                    key={comment.id}
                    className="mb-10 border-b border-[#DEDEDE] py-6"
                  >
                    <div className="mb-1 flex flex-col">
                      <div className="flex items-center">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            navigate(`${Routes.profile}/${comment.userId}`)
                          }
                          onKeyDown={() =>
                            navigate(`${Routes.profile}/${comment.userId}`)
                          }
                          className="cursor-pointer"
                          aria-label="Go to user page"
                        >
                          {comment.user.profileImage ? (
                            <img
                              src={comment.user.profileImage}
                              alt="userProfilePhoto"
                              className="h-[44px] w-[44px] rounded-[32px]"
                            />
                          ) : (
                            <div className="flex">
                              <AvatarIcon size={44} />
                            </div>
                          )}
                        </div>
                        <div className="ml-2 flex flex-col items-start dark:text-white">
                          <span className="text-lg font-medium">
                            {comment.user.fullName}
                          </span>
                          <span className="text-sm text-[#989292]">
                            {dateFormatter(comment.createdTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 text-left italic dark:text-white">
                      {comment.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-gradientBlue p-4 text-white shadow-lg">
                  <p className="text-2xl font-bold">
                    {t("Review.noComments.title")}
                  </p>
                  <p className="mt-2 text-sm">
                    {t("Review.noComments.description")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </Layout>
  );
};

export default ReviewPage;
