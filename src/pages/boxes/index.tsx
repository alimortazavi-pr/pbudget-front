import { GetServerSideProps } from "next";
import { Button, useDisclosure } from "@chakra-ui/react";
import { useEffect, useState } from "react";

//Types
import { IBox } from "@/ts/interfaces/box.interface";
import { theBoxesProps } from "@/ts/types/box.type";
import { boxesSelector } from "@/store/box/selectors";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setBoxes } from "@/store/box/actions";

//Components
import TheNavigation from "@/components/layouts/TheNavigation";
import SingleBox from "@/components/boxes/SingleBox";
import CreateBoxModal from "@/components/boxes/CreateBoxModal";
import EditBoxModal from "@/components/boxes/EditBoxModal";
import SkeletonBoxesList from "@/components/boxes/SkeletonBoxesList";

//Tools
import api from "@/api";

export default function TheBoxes({ boxes }: theBoxesProps) {
  //Redux
  const dispatch = useAppDispatch();
  const globalBoxes = useAppSelector(boxesSelector);

  //ChakraUI
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenEditBox,
    onOpen: onOpenEditBox,
    onClose: onCloseEditBox,
  } = useDisclosure();

  //States
  const [boxEdit, setBoxEdit] = useState<IBox | null>();

  //Effects
  useEffect(() => {
    dispatch(setBoxes(boxes));
  }, [boxes]);

  return (
    <div className="flex flex-col items-center md:mt-5">
      <TheNavigation title="مدیریت باکس ها" isEnabledPreviousPageIcon />
      <div className="px-2 md:px-0 w-full max-w-md">
        <Button
          colorScheme={"rose"}
          className="w-full mb-2"
          type="submit"
          onClick={onOpen}
        >
          ایجاد باکس
        </Button>
        <ul className="px-3 flex flex-col gap-x-2 gap-y-5 bg-white dark:bg-gray-800 p-5 rounded-2xl md:rounded-md">
          <SkeletonBoxesList />
          {globalBoxes?.length !== 0 ? (
            globalBoxes?.map((box) => (
              <SingleBox
                key={box._id}
                box={box}
                setBoxEdit={setBoxEdit}
                onOpen={onOpenEditBox}
              />
            ))
          ) : (
            <span className="dark:text-gray-200">
              هنوز باکس ای ایجاد نکرده اید ...
            </span>
          )}
        </ul>
      </div>
      <CreateBoxModal isOpen={isOpen} onClose={onClose} onOpen={onOpen} />
      <EditBoxModal
        isOpen={isOpenEditBox}
        onClose={onCloseEditBox}
        onOpen={onOpenEditBox}
        box={boxEdit as IBox}
        setBoxEdit={setBoxEdit}
      />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  query,
}) => {
  let boxes: IBox[] = [];
  try {
    if (req.cookies.userAuthorization) {
      const transformedData = JSON.parse(req.cookies.userAuthorization);
      const response = await api.get(`/boxes`, {
        headers: {
          Authorization: `Bearer ${transformedData.token}`,
        },
      });
      boxes = response.data.boxes;
    }
  } catch (error: any) {
    console.log(error.response?.data);
  }

  return {
    props: {
      boxes: boxes,
    },
  };
};
