/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import {
  // IBasePickerSuggestionsProps,
  NormalPeoplePicker,
} from "@fluentui/react/lib/Pickers";
import {
  DatePicker,
  IDatePicker,
  mergeStyleSets,
  defaultDatePickerStrings,
  ChoiceGroup,
} from "@fluentui/react";
import { Panel } from "@fluentui/react";
import { useEffect, useRef, useState } from "react";
import { graph } from "@pnp/graph";
// import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import { Button } from "primereact/button";
import Webcam from "react-webcam";

import styles from "./TaskForm.module.scss";
import PreviewImages from "../PreviewImages/PreViewImages";
import { Toast } from "primereact/toast";

interface taskDetails {
  Title: string;
  Description: string;
  Priority: string;
  Progress: any;
  StartDate: any;
  DueDate: any;
  Id: number;
  AssignedTo: any[];
  CemeteryLocationId?: number;
  CemeteryLocation?: string;
  GroupName?: string;
  Notes?: string;
}

interface dropDownOptions {
  Id?: number;
  key: string;
  text: string;
  GroupName?: string;
}
interface formDataDetails {
  Title?: string;
  Description?: string;
  Notes?: string;
  CemeteryLocationId?: number;
  CemeteryLocation?: any;
  GroupName?: string;
  Priority?: any;
  Progress?: any;
  StartDate?: any;
  DueDate?: any;
  Id?: any;
  AssignedTo?: any[];
  AssignedBy?: any[];
  TaskType?: string;
  isValid?: boolean;
  recOwner?: boolean;
}
interface TaskFormProps {
  webPartProps: any;
  initialData: formDataDetails | undefined;
  userCemeteryList: dropDownOptions[] | undefined;
  setAllTasksList: React.Dispatch<
    React.SetStateAction<taskDetails[] | undefined>
  >;
  setOpenForm: React.Dispatch<React.SetStateAction<boolean>>;
}

const TaskForm: React.FC<TaskFormProps> = ({
  webPartProps,
  initialData,
  userCemeteryList,
  setAllTasksList,
  setOpenForm,
}) => {
  //   const listWeb = Web("https://chandrudemo.sharepoint.com/sites/testXML14");
  const listWeb = Web(
    "https://libitinaco.sharepoint.com/sites/CemeterySociety2"
  );
  const datePickerRef = useRef<IDatePicker>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const toast = useRef<Toast>(null);
  const priorityOptions = [
    { key: "Critical", text: "Critical" },
    { key: "High", text: "High" },
    { key: "Medium", text: "Medium" },
    { key: "Low", text: "Low" },
  ];
  const progressOptions = [
    { key: "Not started", text: "Not started" },
    { key: "In progress", text: "In progress" },
    { key: "Completed", text: "Completed" },
  ];

  const datePickerStyles = mergeStyleSets({
    root: { selectors: { "> *": { marginBottom: 15 } } },
    control: { maxWidth: 300, marginBottom: 15 },
  });

  // React States

  const [formData, setFormData] = useState<formDataDetails>();
  const [dialogLoader, setDialogLoader] = useState<boolean>(false);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<boolean>(false);
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(0);
  const [cemeteryList, setCemeteryList] = useState<dropDownOptions[]>();
  const [adGroupUsers, setADGroupUsers] = useState<
    { text: string; secondaryText: string }[]
  >([]);
  const [images, setImages] = useState<any[]>([]);

  const onFilterChanged = (filterText: string) => {
    return filterText
      ? adGroupUsers.filter((user) =>
          user.text.toLowerCase().includes(filterText.toLowerCase())
        )
      : [];
  };

  const onFormatDate = (date?: Date): string => {
    return !date
      ? ""
      : date.getDate() +
          "/" +
          (date.getMonth() + 1) +
          "/" +
          (date.getFullYear() % 100);
  };

  const onParseDateFromString = React.useCallback(
    (newValue: string): Date => {
      const previousValue = formData?.StartDate || new Date();
      const newValueParts = (newValue || "").trim().split("/");
      const day =
        newValueParts.length > 0
          ? Math.max(1, Math.min(31, parseInt(newValueParts[0], 10)))
          : previousValue.getDate();
      const month =
        newValueParts.length > 1
          ? Math.max(1, Math.min(12, parseInt(newValueParts[1], 10))) - 1
          : previousValue.getMonth();
      let year =
        newValueParts.length > 2
          ? parseInt(newValueParts[2], 10)
          : previousValue.getFullYear();
      if (year < 100) {
        year +=
          previousValue.getFullYear() - (previousValue.getFullYear() % 100);
      }
      return new Date(year, month, day);
    },
    [formData?.StartDate]
  );

  const handleFileUpload = (event: any) => {
    const files = Array.from(event.target.files);
    const existingFileNames = images.map((img: any) => img.name.toLowerCase());

    // Filter out duplicate files
    const newFiles = files.filter((file: any) => {
      const isDuplicate = existingFileNames.includes(file.name.toLowerCase());
      if (isDuplicate) {
        toast.current &&
          toast.current.show({
            severity: "warn",
            summary: "Warning",
            detail: `File ${file.name} is already uploaded.`,
            life: 3000,
          });
      }
      return !isDuplicate; // Only return non-duplicate files
    });

    if (newFiles.length > 0) {
      const newImages = newFiles.map((file: any) => ({
        id: file.name + Date.now(),
        url: URL.createObjectURL(file),
        file: file,
        name: file.name,
      }));

      setImages([...images, ...newImages]); // Add to state

      // Reset file input so the same file can be reselected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index: any) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);

    // Reset file input field if no images remain
    if (updatedImages.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Function to fetch all groups from Microsoft Graph API
  async function getAllGroups(Clients: any): Promise<any[]> {
    let allGroups: any[] = [];
    let url = "/groups"; // Microsoft Graph API endpoint

    try {
      do {
        const response = await Clients.api(url).version("v1.0").get();
        allGroups = allGroups.concat(response.value);

        // Check if there's more data (paging)
        url = response["@odata.nextLink"] || null;
      } while (url);

      return allGroups;
    } catch (error) {
      console.error("Error fetching groups:", error);
      return [];
    }
  }

  // Function to handle form data change

  const formOnChange = async (value: any, field: string) => {
    const tempObj = { ...formData };
    if (field === "CemeteryLocation") {
      if (value?.GroupName !== formData?.GroupName) {
        setDialogLoader(true);
        await webPartProps?.SpContext?._msGraphClientFactory
          .getClient()
          .then(async (client: any) => {
            const groups = await getAllGroups(client);
            // setAdGroupsList([...groups]);
            groups.forEach((group) => {
              if (group.displayName === value?.GroupName) {
                graph.groups
                  .getById(group?.id)
                  .members.get()
                  .then((result: any) => {
                    const tempArray: any[] = [];
                    result?.forEach((item: any) => {
                      const tempObj = {
                        text: item.displayName,
                        secondaryText: item.mail,
                      };
                      tempArray.push(tempObj);
                    });
                    setADGroupUsers([...tempArray]);
                    setDialogLoader(false);
                  })
                  .catch((err: any) => {
                    console.log(err);
                  });
              }
            });
          });
      }
      setFormData({
        ...formData,
        CemeteryLocationId: value?.Id,
        GroupName: value?.GroupName,
        AssignedTo: [],
        [field]: value,
      });
      return;
    } else {
      if (field === "DueDate") {
        const startDate = new Date(formData?.StartDate);
        const endDate = new Date(value);
        if (endDate < startDate && value) {
          setFormData({ ...formData, DueDate: "" });
          if (toast.current) {
            toast.current.show({
              severity: "warn",
              summary: "Warning",
              detail: "Due date should be after start date",
              life: 3000,
            });
          }
          return;
        } else {
          setFormData({ ...tempObj, [field]: value });
          return;
        }
      }
      setFormData({ ...tempObj, [field]: value });
    }
  };

  const handleUserChange = (items: any[]) => {
    const seen = new Set<string>();
    for (const user of items) {
      const email = user.secondaryText.toLowerCase();
      if (seen.has(email)) {
        toast.current &&
          toast.current.show({
            severity: "warn",
            summary: "Warning",
            detail: `User ${user?.text} already added`,
            life: 3000,
          });
        return;
      }
      seen.add(email);
    }
    formOnChange(items, "AssignedTo");
  };
  const formValidation = () => {
    const tempObj = { ...formData };
    let isvalid = true;
    if (formData?.Title === "") {
      isvalid = false;
    } else if (formData?.CemeteryLocation?.text === "") {
      isvalid = false;
    } else if (formData?.AssignedTo?.length === 0) {
      isvalid = false;
    } else if (formData?.StartDate === "") {
      isvalid = false;
    } else if (formData?.DueDate === "") {
      isvalid = false;
    }
    setFormData({ ...tempObj, isValid: isvalid });
    return isvalid;
  };

  // Function for task form submit

  const taskSubmissionFunction = async (isNew: boolean) => {
    const isValid = formValidation();
    if (!isValid) {
      return;
    }
    try {
      const user = await listWeb.currentUser.get();
      setDialogLoader(true);
      const userIds: any[] = [];
      await Promise.all(
        (formData?.AssignedTo || []).map(async (user: any) => {
          await listWeb.ensureUser(user?.secondaryText).then((user: any) => {
            userIds.push(user?.data?.Id);
          });
        })
      );
      const payload = {
        Title: formData?.Title,
        Description: formData?.Description,
        CemeteryLocationId: formData?.CemeteryLocationId,
        AssignedTo0Id: { results: userIds },
        Priority: formData?.Priority,
        Progress: formData?.Progress,
        StartDate: new Date(formData?.StartDate),
        DueDate: new Date(formData?.DueDate),
        Notes: formData?.Notes,
      };
      if (isNew) {
        const res = await listWeb.lists
          .getByTitle("AllTasks")
          .items.add(payload);
        const itemId = res.data.Id;
        for (const file of images) {
          // const buffer = await getFileBuffer(file);
          await listWeb.lists
            .getByTitle("AllTasks")
            .items.getById(itemId)
            .attachmentFiles.add(file.name, file.file);
        }
        const tempObject = {
          Id: itemId,
          Title: formData?.Title,
          Description: formData?.Description,
          CemeteryLocation: formData?.CemeteryLocation?.text,
          CemeteryLocationId: formData?.CemeteryLocationId,
          GroupName: formData?.GroupName,
          AssignedTo: formData?.AssignedTo,
          AssignedBy: [
            {
              text: user?.Title,
              secondaryText: user?.Email,
            },
          ],
          Priority: formData?.Priority,
          Progress: formData?.Progress,
          StartDate: formData?.StartDate,
          DueDate: formData?.DueDate,
          Notes: formData?.Notes,
          recOwner: true,
        };
        setAllTasksList((obj: any) => {
          return [...obj, tempObject].sort((a: any, b: any) => b.Id - a.Id);
        });
        setDialogLoader(false);
        setOpenForm(false);
        setImages([]);
      } else {
        listWeb.lists
          .getByTitle("AllTasks")
          .items.getById(formData?.Id)
          .update(payload)
          .then(async (res: any) => {
            const existingAttachments = await listWeb.lists
              .getByTitle("AllTasks")
              .items.getById(formData?.Id)
              .attachmentFiles();
            for (const attachment of existingAttachments) {
              if (
                !images.some((img: any) => img.name === attachment.FileName)
              ) {
                await listWeb.lists
                  .getByTitle("AllTasks")
                  .items.getById(formData?.Id)
                  .attachmentFiles.getByName(attachment.FileName)
                  .delete();
              }
            }

            // Add new attachments
            for (const image of images) {
              // const buffer = await getFileBuffer(image);
              if (
                !existingAttachments.some(
                  (att: any) => att.FileName === image.name
                )
              ) {
                await listWeb.lists
                  .getByTitle("AllTasks")
                  .items.getById(formData?.Id)
                  .attachmentFiles.add(image.name, image.file);
              }
            }
            const tempObject = {
              Id: formData?.Id,
              Title: formData?.Title,
              Description: formData?.Description,
              CemeteryLocation: formData?.CemeteryLocation?.text,
              CemeteryLocationId: formData?.CemeteryLocationId,
              GroupName: formData?.GroupName,
              AssignedTo: formData?.AssignedTo,
              AssignedBy: formData?.AssignedBy,
              Priority: formData?.Priority,
              Progress: formData?.Progress,
              StartDate: formData?.StartDate,
              DueDate: formData?.DueDate,
              Notes: formData?.Notes,
              recOwner: formData?.recOwner,
            };
            setAllTasksList((prevTasks: any) =>
              prevTasks
                .map((task: any) =>
                  task.Id === formData?.Id ? tempObject : task
                )
                .sort((a: any, b: any) => b.Id - a.Id)
            );
            setDialogLoader(false);
            setOpenForm(false);
            setImages([]);
          })
          .catch((err: any) => {
            console.log("Error : ", err);
          });
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function for get task attchments
  const getAttachments = (id: any) => {
    listWeb.lists
      .getByTitle("AllTasks")
      .items.getById(id)
      .attachmentFiles.get()
      .then((res: any) => {
        const tempArray: any[] = [];
        res?.forEach((item: any) => {
          const tempObj = {
            id: item.Id, // Unique ID
            url: item.ServerRelativeUrl,
            file: item, // Store actual file
            name: item.FileName,
          };
          tempArray.push(tempObj);
        });
        setImages(tempArray);
      })
      .catch((err: any) => {
        console.log(err);
      });
  };

  // Function to fetch group members

  const setGroupUsers = async (GroupName: string) => {
    await webPartProps?.SpContext?._msGraphClientFactory
      .getClient()
      .then(async (client: any) => {
        const groups = await getAllGroups(client);
        // setAdGroupsList([...groups]);
        groups.forEach((group) => {
          if (group.displayName === GroupName) {
            graph.groups
              .getById(group?.id)
              .members.get()
              .then((result: any) => {
                const tempArray: any[] = [];
                result?.forEach((item: any) => {
                  const tempObj = {
                    text: item.displayName,
                    secondaryText: item.mail,
                  };
                  tempArray.push(tempObj);
                });
                setADGroupUsers([...tempArray]);
                setDialogLoader(false);
              })
              .catch((err: any) => {
                console.log(err);
              });
          }
        });
      });
  };

  // Function to fetch cemetery locations on component mount
  useEffect(() => {
    setDialogLoader(true);
    setFormData(initialData);
    setCemeteryList(userCemeteryList);
    if (initialData?.GroupName && initialData?.Id) {
      getAttachments(initialData?.Id);
      setGroupUsers(initialData.GroupName);
    } else {
      setDialogLoader(false);
    }
  }, [initialData?.Id, initialData?.GroupName]);

  const capitalizeFirstLetter = (str: string): string => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div>
      <Toast ref={toast} />
      {dialogLoader ? (
        <div className={styles.dialogLoader}>
          <i
            className="pi pi-spin pi-spinner"
            style={{ fontSize: "2rem", color: "#6c87a1" }}
          ></i>
        </div>
      ) : (
        <>
          {imagePreview && (
            <PreviewImages
              imagesData={images}
              imageIndex={previewImageIndex}
              setImagePreview={setImagePreview}
            />
          )}
          <div className={styles.formHeader}>
            <h2>
              {formData?.TaskType === "New"
                ? "New"
                : formData?.TaskType === "View"
                ? "View"
                : "Edit"}{" "}
              Task
            </h2>
          </div>
          <div
            className={`${imagePreview ? styles.hideSection : ""} ${
              styles.dialogContainer
            }`}
          >
            <div className={styles.sectionWrapper}>
              <div
                className={`inputsection ${styles.sectionControl} ${
                  !formData?.isValid
                    ? formData?.Title === ""
                      ? "error"
                      : "noterror"
                    : "noterror"
                }`}
              >
                <label className={styles.sectionLabel} htmlFor="taskTitle">
                  Task Title *
                </label>
                <InputText
                  disabled={
                    formData?.TaskType === "View" || !formData?.recOwner
                      ? true
                      : false
                  }
                  value={formData?.Title}
                  onChange={(e) =>
                    formOnChange(capitalizeFirstLetter(e.target.value), "Title")
                  }
                  id="taskTitle"
                  aria-describedby="username-help"
                  placeholder="Enter here"
                />
                <span className="errormsg">Please enter title</span>
              </div>
              <div
                className={`inputsection ${styles.sectionControl} ${
                  !formData?.isValid ? "noterror" : "noterror"
                }`}
              >
                <label className={styles.sectionLabel} htmlFor="description">
                  Description
                </label>
                <InputTextarea
                  disabled={
                    formData?.TaskType === "View" || !formData?.recOwner
                      ? true
                      : false
                  }
                  value={formData?.Description}
                  onChange={(e) =>
                    formOnChange(
                      capitalizeFirstLetter(e.target.value),
                      "Description"
                    )
                  }
                  id="description"
                  placeholder="Enter here"
                  rows={3}
                  cols={30}
                  style={{
                    resize: "none",
                    // height: "100%",
                    overflow: "auto",
                  }}
                />
              </div>
            </div>
            <div className={styles.sectionWrapper}>
              <div
                className={`inputsection ${styles.sectionControl} ${
                  !formData?.isValid
                    ? formData?.CemeteryLocation?.text === ""
                      ? "error"
                      : "noterror"
                    : "noterror"
                }`}
              >
                <label className={styles.sectionLabel} htmlFor="location">
                  Cemetery Location *
                </label>
                <Dropdown
                  disabled={
                    formData?.TaskType === "View" || !formData?.recOwner
                      ? true
                      : false
                  }
                  id="location"
                  value={formData?.CemeteryLocation}
                  onChange={(e) => formOnChange(e.value, "CemeteryLocation")}
                  options={cemeteryList}
                  optionLabel="text"
                  placeholder="Select a location"
                  className="w-full md:w-14rem"
                  checkmark={true}
                  highlightOnSelect={false}
                />
                <span className="errormsg">Please select location</span>
              </div>
              <div
                className={`inputsection ${
                  formData?.TaskType === "View" ? "viewOnly" : ""
                } ${styles.sectionControl} ${
                  !formData?.isValid
                    ? formData?.AssignedTo?.length === 0
                      ? "error"
                      : "noterror"
                    : "noterror"
                }`}
              >
                <label className={styles.sectionLabel} htmlFor="assignTo">
                  Assign To *
                </label>
                <NormalPeoplePicker
                  disabled={
                    formData?.TaskType === "View" || !formData?.recOwner
                      ? true
                      : false
                  }
                  onResolveSuggestions={onFilterChanged}
                  getTextFromItem={(item) => item.text || ""}
                  pickerSuggestionsProps={{
                    suggestionsHeaderText: "AD Group Users",
                    noResultsFoundText: "No matching users found",
                  }}
                  itemLimit={10}
                  selectedItems={formData?.AssignedTo}
                  onChange={handleUserChange}
                />
                <span className="errormsg">Please select user</span>
              </div>
            </div>
            {/* <div className={styles.sectionWrapper}></div> */}
            <div className={styles.sectionWrapper}>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div
                  className={`inputsection ${styles.sectionControl} ${
                    !formData?.isValid
                      ? formData?.StartDate === ""
                        ? "error"
                        : "noterror"
                      : "noterror"
                  }`}
                >
                  <label className={styles.sectionLabel} htmlFor="startdate">
                    Start Date *
                  </label>
                  <DatePicker
                    disabled={
                      formData?.TaskType === "View" || !formData?.recOwner
                        ? true
                        : false
                    }
                    minDate={new Date()}
                    maxDate={
                      formData?.DueDate
                        ? new Date(formData?.DueDate)
                        : undefined
                    }
                    componentRef={datePickerRef}
                    allowTextInput
                    ariaLabel="Select a date. Input format is day slash month slash year."
                    value={formData?.StartDate}
                    onSelectDate={(date?: Date) =>
                      formOnChange(date, "StartDate")
                    }
                    formatDate={onFormatDate}
                    parseDateFromString={onParseDateFromString}
                    className={datePickerStyles.control}
                    strings={defaultDatePickerStrings}
                  />
                  <span className="errormsg">Please select start date</span>
                </div>
                <div
                  className={`inputsection ${styles.sectionControl} ${
                    !formData?.isValid
                      ? formData?.DueDate === ""
                        ? "error"
                        : "noterror"
                      : "noterror"
                  }`}
                >
                  <label className={styles.sectionLabel} htmlFor="duedate">
                    Due Date *
                  </label>
                  <DatePicker
                    disabled={
                      formData?.TaskType === "View" ||
                      formData?.StartDate === "" ||
                      !formData?.recOwner
                        ? true
                        : false
                    }
                    minDate={new Date()}
                    componentRef={datePickerRef}
                    allowTextInput
                    ariaLabel="Select a date. Input format is day slash month slash year."
                    value={formData?.DueDate}
                    onSelectDate={(date?: Date) =>
                      formOnChange(date, "DueDate")
                    }
                    formatDate={onFormatDate}
                    parseDateFromString={onParseDateFromString}
                    className={datePickerStyles.control}
                    // DatePicker uses English strings by default. For localized apps, you must override this prop.
                    strings={defaultDatePickerStrings}
                  />
                  <span className="errormsg">Please select duedate</span>
                </div>
              </div>
              {/* <div className={styles.halfSection}></div> */}
              <div className={`inputsection ${styles.sectionControl}`}>
                <label className={styles.sectionLabel} htmlFor="priority">
                  Priority
                </label>
                {formData?.Priority && (
                  <ChoiceGroup
                    disabled={
                      formData?.TaskType === "View" || !formData?.recOwner
                        ? true
                        : false
                    }
                    // defaultSelectedKey={formData?.Priority}
                    selectedKey={formData?.Priority}
                    options={priorityOptions}
                    onChange={(key: any, option) =>
                      formOnChange(option?.key, "Priority")
                    }
                  />
                )}
              </div>
              {formData?.TaskType !== "New" && (
                <div className={`inputsection ${styles.sectionControl}`}>
                  <label className={styles.sectionLabel} htmlFor="progress">
                    Progress
                  </label>
                  {formData?.Progress && (
                    <ChoiceGroup
                      disabled={formData?.TaskType === "Edit" ? false : true}
                      selectedKey={formData?.Progress}
                      // defaultSelectedKey={formData?.Progress}
                      options={progressOptions}
                      onChange={(key: any, option) => {
                        formOnChange(option?.key, "Progress");
                      }}
                    />
                  )}
                </div>
              )}
            </div>
            <div className={styles.sectionWrapper}>
              <div className={`inputsection ${styles.sectionControl}`}>
                <label className={styles.sectionLabel} htmlFor="notes">
                  Notes
                </label>
                <InputTextarea
                  disabled={formData?.TaskType === "View" ? true : false}
                  autoResize
                  value={formData?.Notes}
                  onChange={(e) =>
                    formOnChange(capitalizeFirstLetter(e.target.value), "Notes")
                  }
                  id="notes"
                  placeholder="Enter here"
                  rows={5}
                  cols={30}
                />
              </div>
            </div>
            <div className={styles.fullSectionWrapper}>
              <div className={`inputsection ${styles.sectionControl}`}>
                <div className={styles.attachmentUploader}>
                  <div className={styles.attachmentsBtnSection}>
                    {formData?.TaskType !== "View" && (
                      <label
                        htmlFor="file-upload"
                        className={styles.customFileUpload}
                      >
                        Choose Files
                      </label>
                    )}
                    <input
                      disabled={formData?.TaskType === "View" ? true : false}
                      id="file-upload"
                      type="file"
                      ref={fileInputRef}
                      multiple
                      capture="environment"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    {formData?.TaskType !== "View" && (
                      <i
                        className="pi pi-camera"
                        style={{ color: "slateblue", fontSize: "1.5rem" }}
                        onClick={() => setShowCamera(true)}
                      ></i>
                    )}
                  </div>
                  <div
                    className={
                      formData?.TaskType === "View"
                        ? styles.viewImageList
                        : styles.imageList
                    }
                  >
                    {images.map((img, index) => (
                      <div key={index} className={styles.imageCard}>
                        <div className={styles.imgPreview}>
                          <img
                            src={img.url}
                            alt={img.name}
                            onClick={() => {
                              setImagePreview(true);
                              setPreviewImageIndex(index);
                            }}
                          />
                          {formData?.TaskType !== "View" && (
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleRemoveImage(index)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="16"
                                width="16"
                                viewBox="0 0 24 24"
                                fill="white"
                              >
                                <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <div title={img.name} className={styles.imageName}>
                          {img.name}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.footerSection}>
                    <Button
                      disabled={dialogLoader}
                      label="Close"
                      severity="secondary"
                      icon="pi pi-times"
                      onClick={() => {
                        setImages([]);
                        setOpenForm(false);
                      }}
                      className="p-button-text"
                      size="small"
                    />
                    {formData?.TaskType !== "View" && (
                      <Button
                        severity="secondary"
                        disabled={dialogLoader}
                        label={
                          formData?.TaskType === "New" ? "Submit" : "Update"
                        }
                        icon="pi pi-check"
                        onClick={() =>
                          taskSubmissionFunction(
                            formData?.TaskType === "New" ? true : false
                          )
                        }
                        size="small"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <Panel
        isOpen={showCamera}
        onDismiss={() => setShowCamera(false)}
        headerText="Capture Image"
        isLightDismiss
        isBlocking={false}
        closeButtonAriaLabel="Close"
        type={window.innerWidth < 600 ? 7 : 4} // Full-screen on mobile
      >
        <div className={styles.webcamContainer}>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            audio={false}
            className={styles.webcamPreview}
          />

          <div className={styles.cameraBtnGroup}>
            <button
              className={styles.captureBtn}
              onClick={() => {
                const imageSrc = webcamRef.current?.getScreenshot();
                if (imageSrc) {
                  fetch(imageSrc)
                    .then((res) => res.blob())
                    .then((blob) => {
                      const fileName = `photo_${new Date().getTime()}.jpg`;
                      const file = new File([blob], fileName, {
                        type: "image/jpeg",
                      });

                      const newImage = {
                        name: file.name,
                        url: URL.createObjectURL(file),
                        file,
                      };
                      setImages((prev) => [...prev, newImage]);
                      setShowCamera(false);
                    });
                }
              }}
            >
              Take Photo
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => setShowCamera(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
};
export default TaskForm;
