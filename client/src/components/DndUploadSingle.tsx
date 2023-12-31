import { useTranslation } from "react-i18next";
import { uploadProfileImage } from "@app/api/users";
import CloseIcon from "@app/assets/icons/CloseIcon";
import { DndUploadProps } from "@app/types/types";
import { classNames, convertBase64, errorHandler } from "@app/utils";
import { useMutation } from "@tanstack/react-query";
import Loader from "./Loader";

const DndUploadSingle = (props: DndUploadProps) => {
  const { width, url, setUrl } = props;
  const { t } = useTranslation();

  const {
    mutate: uploadProfileImageMutate,
    isLoading: isUploadProfileImageLoading,
  } = useMutation(uploadProfileImage, {
    onSuccess: (response) => {
      setUrl(response);
    },
    onError: errorHandler,
  });

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;

    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const base64: Blob | unknown = await convertBase64(file);
      uploadProfileImageMutate({ image: base64 });
    }
  };

  return (
    <div className="flex w-full items-center justify-center">
      {url ? (
        <div className="relative">
          <div className="absolute right-[-5%] top-[-5%]">
            <button
              className="flex h-[34px] w-[34px] items-center justify-center rounded-[17px] bg-[#D20F0F]"
              onClick={() => setUrl("")}
            >
              <CloseIcon size={17} color={"white"} />
            </button>
          </div>
          <img src={url} alt="profile" className="h-[292px] rounded-[8px]" />
        </div>
      ) : (
        <label
          htmlFor="dropzone-file"
          className={classNames(
            "flex h-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-[transparent] dark:border-[#DEDEDE]",
            width ? `w-[${width}]` : "w-full",
            url ? "border border-none" : null
          )}
        >
          {isUploadProfileImageLoading ? (
            <div className="flex items-center justify-center">
              <Loader />
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                <svg
                  className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">
                    {t("Profile.clickToUpload")}
                  </span>{" "}
                  {t("Profile.orDnD")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  SVG, PNG, JPG or GIF (MAX. 800x400px)
                </p>
              </div>
              <input
                onChange={uploadImage}
                id="dropzone-file"
                type="file"
                className="hidden"
              />
            </>
          )}
        </label>
      )}
    </div>
  );
};

export default DndUploadSingle;
