import { GetServerSideProps } from "next";
import { Button, useDisclosure } from "@chakra-ui/react";
import { useState } from "react";

//Types
import { ICategory } from "@/ts/interfaces/category.interface";
import { theCategoriesProps } from "@/ts/types/category.type";

//Redux
import { categoriesSelector } from "@/store/category/selectors";
import { useAppSelector } from "@/store/hooks";

//Components
import TheNavigation from "@/components/layouts/TheNavigation";
import SingleCategory from "@/components/categories/SingleCategory";
import CreateCategoryModal from "@/components/categories/CreateCategoryModal";
import EditCategoryModal from "@/components/categories/EditCategoryModal";

//Tools
import api from "@/api";
import SkeletonCategoriesList from "@/components/categories/SkeletonCategoriesList";

export default function TheCategories({}: theCategoriesProps) {
  //Redux
  const categories = useAppSelector(categoriesSelector);

  //ChakraUI
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenEditCategory,
    onOpen: onOpenEditCategory,
    onClose: onCloseEditCategory,
  } = useDisclosure();

  //States
  const [categoryEdit, setCategoryEdit] = useState<ICategory | null>();

  return (
    <div className="flex flex-col items-center md:mt-5">
      <TheNavigation title="مدیریت دسته ها" isEnabledPreviousPageIcon />
      <div className="px-2 md:px-0 w-full max-w-md">
        <Button
          colorScheme={"rose"}
          className="w-full mb-2"
          type="submit"
          onClick={onOpen}
        >
          ایجاد دسته بندی
        </Button>
        <ul className="px-3 flex flex-col gap-x-2 gap-y-5 bg-white dark:bg-gray-800 p-5 rounded-2xl md:rounded-md">
          <SkeletonCategoriesList />
          {categories?.length !== 0 ? (
            categories?.map((category) => (
              <SingleCategory
                key={category._id}
                category={category}
                setCategoryEdit={setCategoryEdit}
                onOpen={onOpenEditCategory}
              />
            ))
          ) : (
            <span className="dark:text-gray-200">
              هنوز دسته ای ایجاد نکرده اید ...
            </span>
          )}
        </ul>
      </div>
      <CreateCategoryModal isOpen={isOpen} onClose={onClose} onOpen={onOpen} />
      <EditCategoryModal
        isOpen={isOpenEditCategory}
        onClose={onCloseEditCategory}
        onOpen={onOpenEditCategory}
        category={categoryEdit as ICategory}
        setCategoryEdit={setCategoryEdit}
      />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  query,
}) => {
  let categories: ICategory[] = [];
  try {
    if (req.cookies.userAuthorization) {
      const transformedData = JSON.parse(req.cookies.userAuthorization);
      const response = await api.get(`/categories`, {
        headers: {
          Authorization: `Bearer ${transformedData.token}`,
        },
      });
      categories = response.data.categories;
    }
  } catch (error: any) {
    console.log(error.response?.data);
  }

  return {
    props: {
      categories: categories,
    },
  };
};
