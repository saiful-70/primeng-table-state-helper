import { DatePipe } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import { ConfirmationService } from "primeng/api";
import { Button } from "primeng/button";
import { Checkbox } from "primeng/checkbox";
import { Chip } from "primeng/chip";
import { DatePicker } from "primeng/datepicker";
import { Dialog } from "primeng/dialog";
import { DialogService } from "primeng/dynamicdialog";
import {
  FileUploadErrorEvent,
  FileUploadEvent,
  FileUploadModule
} from "primeng/fileupload";
import { InputNumber } from "primeng/inputnumber";
import { InputText } from "primeng/inputtext";
import { MultiSelect } from "primeng/multiselect";
import { Popover } from "primeng/popover";
import { Select } from "primeng/select";
import { Table, TableModule } from "primeng/table";
import { Tag } from "primeng/tag";
import { Toolbar } from "primeng/toolbar";
import { ulid } from "ulid";
import { environment } from "../../../../../../../../environments/environment";
import { AuthStore } from "../../../../../../../core/features/auth/auth.store";
import { BasicConfirmDialogComponent } from "../../../../../../../shared/components/basic-confirm-dialog/basic-confirm-dialog.component";
import { ReactiveFormErrorMessageComponent } from "../../../../../../../shared/components/reactive-form-error-message/reactive-form-error-message.component";
import { ToggleValidationErrorAreaDirective } from "../../../../../../../shared/directives/toggle-validation-error-area.directive";
import { commonToastMessages } from "../../../../../../../shared/domain/constants/common-toast-messages";
import {
  KeyData,
  ManipulationType
} from "../../../../../../../shared/domain/models/shared.models";
import { RecursiveNullish } from "../../../../../../../shared/domain/models/typescript-utils";
import { ComponentDataStorage } from "../../../../../../../shared/helpers/component-data-storage";
import { ComponentState } from "../../../../../../../shared/helpers/component-state";
import {
  PrimeNgTableHeader,
  PrimeNgTableStateHelper
} from "../../../../../../../shared/helpers/primeng-table-state.helper";
import { FormatterService } from "../../../../../../../shared/services/formatter.service";
import { ReactiveFormUtilsService } from "../../../../../../../shared/services/reactive-form-utils.service";
import { ToastService } from "../../../../../../../shared/services/toast.service";
import { UiService } from "../../../../../../../shared/services/ui.service";
import {
  Igmt4ProcessDataBankRequestModel,
  Igmt4ProcessDataBankRequestSchema,
  Igmt4ProcessDataBankResponseModel,
  Igmt4ProcessDataBankResponseSchema,
  VideoForm,
  VideoResponseModel
} from "../../igmt4-process-data-bank.model";
import { Igmt4ProcessDataBankService } from "../../igmt4-process-data-bank.service";
import { Igmt4ProcessDataBankReviseComponent } from "../igmt4-process-data-bank-revise/igmt4-process-data-bank-revise.component";
@Component({
  selector: "mtsl-igmt4-process-data-bank-table",
  standalone: true,
  imports: [
    Button,
    DatePipe,
    Dialog,
    Popover,
    ReactiveFormsModule,
    TableModule,
    Tag,
    ToggleValidationErrorAreaDirective,
    ReactiveFormErrorMessageComponent,
    Toolbar,
    InputText,
    Select,
    MultiSelect,
    InputNumber,
    Chip,
    Checkbox,
    FileUploadModule,
    DatePicker,
    BasicConfirmDialogComponent,
    Igmt4ProcessDataBankReviseComponent
  ],
  templateUrl: "./igmt4-process-data-bank-table.component.html",
  providers: [ConfirmationService, DialogService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Igmt4ProcessDataBankTableComponent {
  readonly uiService = inject(UiService);
  readonly authStore = inject(AuthStore);
  readonly httpClient = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly IGMT4ProcessDataBankService = inject(
    Igmt4ProcessDataBankService
  );
  readonly toastService = inject(ToastService);
  readonly reactiveFormUtils = inject(ReactiveFormUtilsService);
  readonly confirmationService = inject(ConfirmationService);
  private readonly formatterService = inject(FormatterService);

  readonly dataTableRef = viewChild.required<Table>("dt");

  readonly tableState =
    PrimeNgTableStateHelper.create<Igmt4ProcessDataBankResponseModel>({
      url: "",
      httpClient: this.httpClient
    });

  readonly componentData =
    new ComponentDataStorage<Igmt4ProcessDataBankResponseModel>();
  readonly componentState = new ComponentState().updateComponentTitle(
    "Process Data Bank"
  );
  tableData = linkedSignal<VideoResponseModel[]>(() => {
    return (
      this.componentData.singleData()?.referenceVideos.map((video) => ({
        ...video,
        stateId: ulid()
      })) || []
    );
  });
  currentSelectedSpec = input.required<KeyData<number, string>>();
  uploadVideoUrl = signal<string>(
    environment.API.V1.INDUSTRIAL_GARMENTS_REVOLUTION_4.SHARED.UPLOAD_VIDEO
  );

  machineSpecifications = signal<KeyData<number, string>[]>([]);
  complexities = signal<KeyData<number, string>[]>([]);
  frequentDefects = signal<KeyData<number, string>[]>([]);

  readonly form = this.fb.nonNullable.group({
    serial: [0, [Validators.required, Validators.min(1)]],
    code: ["", Validators.required],
    name: ["", Validators.required],
    description: ["", Validators.required],
    conditionDescription: [""],
    guideFolderDescription: [""],
    frequentDefects: this.fb.control<KeyData<number, string>[]>([]),
    complexity: this.fb.control<KeyData<number, string> | null>(
      null,
      Validators.required
    ),
    sewingMachineSpecification: this.fb.control<KeyData<number, string> | null>(
      null
    ),
    standardMinuteValue: [0.0, Validators.required],
    singleStroke: this.fb.control<string>("", {
      validators: [Validators.pattern(/^\d{1,3}\|\d{1,3}$/)]
    }),
    strokes: this.fb.control<{ id: string; value: string }[]>([], {
      validators: Validators.required,
      nonNullable: true
    }),
    isGuideAttach: [false],
    isFolderAttach: [false],
    isSpecialProcess: [false],
    isDataLocked: [false],
    seamLengthInCm: [0, [Validators.min(0)]],
    numberOfXProcess: [0, [Validators.min(0)]],
    videos: this.fb.array<FormGroup<VideoForm>>([])
  });

  constructor() {
    toObservable(this.currentSelectedSpec)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (data) => {
        this.tableState.setUrl(
          environment.API.V1.INDUSTRIAL_GARMENTS_REVOLUTION_4.CONFIGURATIONS.PROCESS_DATA_BANK.QUERY(
            data.key.toString()
          )
        );
        this.tableState.clearTableData(this.dataTableRef());
      });
  }

  ngOnInit() {
    this.form.controls.seamLengthInCm.disable();

    this.getControlOverValueChanges();
  }

  getControlOverValueChanges() {
    this.form.controls.singleStroke.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.form.controls.strokes.setErrors({ hasValue: true });
        } else {
          if (this.form.controls.strokes.value.length > 0) {
            this.form.controls.strokes.setErrors(null);
          }
        }
        this.form.updateValueAndValidity();
      });

    this.form.controls.sewingMachineSpecification.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value?.data.toLowerCase() === "manual") {
          this.form.controls.isSpecialProcess.reset();
          this.form.controls.seamLengthInCm.reset();
          this.form.controls.numberOfXProcess.reset();

          this.form.controls.isSpecialProcess.disable({emitEvent: false});
          this.form.controls.seamLengthInCm.disable();
          this.form.controls.numberOfXProcess.disable();
        } else {
          this.form.controls.isSpecialProcess.enable();
        }
      });

    this.form.controls.isSpecialProcess.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isSpecialProcess) => {
        if(this.form.controls.sewingMachineSpecification.value?.data.toLowerCase() === "manual") 
          return;
        
        if (isSpecialProcess) {
          this.form.controls.seamLengthInCm.disable();
          this.form.controls.numberOfXProcess.enable();
          this.form.controls.seamLengthInCm.reset();

          this.form.controls.seamLengthInCm.clearValidators();
          this.form.controls.numberOfXProcess.addValidators(
            Validators.required
          );
        } else {
          this.form.controls.seamLengthInCm.enable();
          this.form.controls.numberOfXProcess.disable();
          this.form.controls.numberOfXProcess.reset();

          this.form.controls.seamLengthInCm.addValidators(Validators.required);
          this.form.controls.numberOfXProcess.clearValidators();
        }

        this.form.controls.seamLengthInCm.updateValueAndValidity();
        this.form.controls.numberOfXProcess.updateValueAndValidity();
      });

    this.form.controls.isFolderAttach.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isFolderAttach) => {
        if (isFolderAttach) {
          this.form.controls.isGuideAttach.setValue(false, {
            emitEvent: false
          });
        }
      });

    this.form.controls.isGuideAttach.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isGuideAttach) => {
        if (isGuideAttach) {
          this.form.controls.isFolderAttach.setValue(false, {
            emitEvent: false
          });
        }
      });
  }

  openCreateDialog() {
    this.form.reset();
    this.videos.clear();
    this.componentState.isCreateOrUpdateDialogOpen.set(true);
    this.componentState.manipulationType.set(ManipulationType.Create);
  }

  async openUpdateDialog() {
    const dataForPopulate = this.componentData.singleData();

    if (!dataForPopulate) {
      throw new Error("Data is not available. Please try again.");
    }

    this.componentState.manipulationType.set(ManipulationType.Update);

    this.form.reset();

    try {
      await Promise.all([
        this.getMachineSpecifications(),
        this.getFrequentDefects(),
        this.getComplexities()
      ]);

      const parsedData =
        await Igmt4ProcessDataBankResponseSchema.parseAsync(dataForPopulate);

      const parsedSingleMachineSpec = this.machineSpecifications().find(
        (machineSpec) =>
          machineSpec.data === parsedData.sewingMachineSpecification
      );
      const parsedFrequentDefects = this.frequentDefects().filter((defect) => {
        return parsedData.frequentDefects?.includes(defect.data);
      });
      const parsedSingleComplexity = this.complexities().find(
        (complexity) => complexity.data === parsedData.complexity
      );

      if (
        !parsedSingleMachineSpec ||
        !parsedFrequentDefects ||
        !parsedSingleComplexity
      ) {
        throw Error("Some data mismatched");
      }

      const parsedStrokes = parsedData.strokes
        .split(",")
        .map((stroke) => ({ id: ulid(), value: stroke }));

      this.populateVideoForm();

      this.form.patchValue({
        serial: parsedData.serial,
        code: parsedData.code,
        name: parsedData.name,
        description: parsedData.description,
        conditionDescription: parsedData.conditionDescription || "",
        guideFolderDescription: parsedData.guideFolderDescription || "",
        sewingMachineSpecification: parsedSingleMachineSpec,
        frequentDefects: parsedFrequentDefects,
        complexity: parsedSingleComplexity,
        strokes: parsedStrokes,
        singleStroke: "",
        standardMinuteValue: parsedData.standardMinuteValue,
        isGuideAttach: parsedData.isGuideAttach,
        isFolderAttach: parsedData.isFolderAttach,
        isSpecialProcess: parsedData.isSpecialProcess,
        seamLengthInCm: parsedData.seamLengthInCm,
        numberOfXProcess: parsedData.numberOfXProcess,
        isDataLocked: parsedData.isDataLocked
      });

      if (parsedData.isDataLocked) {
        this.reactiveFormUtils.disableSelectiveControls(this.form, [
          this.form.controls.serial,
          this.form.controls.code,
          this.form.controls.name,
          this.form.controls.description,
          this.form.controls.conditionDescription,
          this.form.controls.guideFolderDescription,
          this.form.controls.sewingMachineSpecification,
          this.form.controls.frequentDefects,
          this.form.controls.complexity,
          this.form.controls.singleStroke,
          this.form.controls.strokes,
          this.form.controls.standardMinuteValue,
          this.form.controls.isGuideAttach,
          this.form.controls.isFolderAttach,
          this.form.controls.isSpecialProcess,
          this.form.controls.seamLengthInCm,
          this.form.controls.numberOfXProcess,
          this.form.controls.isDataLocked
        ]);
      }

      this.componentState.isCreateOrUpdateDialogOpen.set(true);
    } catch (error) {
      throw error;
    }
  }

  async makeRequestBody(): Promise<Igmt4ProcessDataBankRequestModel> {
    const data: RecursiveNullish<Igmt4ProcessDataBankRequestModel> = {
      partOperationSpecificationId: this.currentSelectedSpec()?.key,
      serial: this.form.controls.serial.value,
      code: this.form.controls.code.value,
      name: this.form.controls.name.value,
      description: this.form.controls.description.value,
      conditionDescription:
        this.form.controls.conditionDescription.value || null,
      guideFolderDescription:
        this.form.controls.guideFolderDescription.value || null,
      frequentDefects:
        this.form.controls.frequentDefects.value?.map((defect) => {
          return defect.key;
        }) || [],
      sewingMachineSpecificationId:
        this.form.controls.sewingMachineSpecification.value?.key,
      processComplexityId: this.form.controls.complexity.value?.key,
      standardMinuteValue: this.form.controls.standardMinuteValue.value,
      strokes: this.form.controls.strokes.value
        .map((stroke) => stroke.value)
        .join(","),
      isGuideAttach: this.form.controls.isGuideAttach.value ?? false,
      isFolderAttach: this.form.controls.isFolderAttach.value ?? false,
      isSpecialProcess: this.form.controls.isSpecialProcess.value ?? false,
      seamLengthInCm: this.form.controls.seamLengthInCm.value,
      numberOfXProcess: this.form.controls.numberOfXProcess.value,
      isDataLocked: this.form.controls.isDataLocked.value ?? false,
      referenceVideos: this.form.controls.videos.value.map((x) => ({
        videoNo: x.videoNo,
        videoTitle: x.videoTitle,
        videoDesc: x.videoDesc ?? null,
        videoUrl: x.videoUrl,
        processInitOn: this.formatterService.formatToISODate(
          x.processInitOn || null,
          true
        )
      }))
    };

    return await Igmt4ProcessDataBankRequestSchema.parseAsync(data);
  }

  async createOrUpdate() {
    if (this.componentState.isOnUpdateState()) {
      await this.update();
    } else {
      await this.create();
    }
  }

  async create(): Promise<void> {
    if (!this.form.valid) {
      throw new Error("Form is not valid. Please fill form and try again.");
    }

    try {
      this.componentState.isAjaxRequestOutgoing.set(true);
      const requestBody = await this.makeRequestBody();
      await this.IGMT4ProcessDataBankService.create(requestBody);
      await this.toastService.showSuccessToast(
        "Created",
        commonToastMessages.Created
      );
      this.tableState.clearTableData(this.dataTableRef());
      this.onDialogClose();
    } catch (error) {
      throw error;
    } finally {
      this.componentState.isAjaxRequestOutgoing.set(false);
    }
  }

  async update(isCallFromUploadOrDelete: boolean = false): Promise<void> {
    try {
      const selectedData = this.componentData.singleData();

      if (!this.form.valid) {
        throw new Error("Please fill all required fields and try again.");
      }

      if (!selectedData) {
        throw new Error("Data not available. Please try again.");
      }
      const requestBody = await this.makeRequestBody();
      await this.IGMT4ProcessDataBankService.update(
        selectedData.id,
        requestBody
      );

      if (!isCallFromUploadOrDelete) {
        this.tableState.clearTableData(this.dataTableRef());
        this.toastService.showSuccessToast(
          "Updated",
          commonToastMessages.Updated
        );

        this.onDialogClose();
      }
    } catch (error) {
      throw error;
    } finally {
      this.componentState.isAjaxRequestOutgoing.set(false);
    }
  }

  async getMachineSpecifications() {
    if (this.machineSpecifications.length > 0) {
      return;
    }
    try {
      const res =
        await this.IGMT4ProcessDataBankService.getMachineSpecifications();
      this.machineSpecifications.set(res.payload);
    } catch (error) {
      throw error;
    }
  }

  async getComplexities() {
    if (this.complexities.length > 0) {
      return;
    }
    try {
      const res = await this.IGMT4ProcessDataBankService.getComplexities();
      this.complexities.set(res.payload);
    } catch (error) {
      throw error;
    }
  }

  async getFrequentDefects() {
    if (this.frequentDefects.length > 0) {
      return;
    }
    try {
      const res = await this.IGMT4ProcessDataBankService.getFrequentDefects();
      this.frequentDefects.set(res.payload);
    } catch (error) {
      throw error;
    }
  }

  onDialogClose() {
    this.reactiveFormUtils.resetFormAndClearArrays(this.form);
    this.tableData.set([]);
    this.reactiveFormUtils.enableAllControls(this.form);
    this.componentState.isCreateOrUpdateDialogOpen.set(false);
    this.componentData.updateSingleData(null);
  }

  async onPopOverMenuOpen(data: Igmt4ProcessDataBankResponseModel) {
    const dataForPopulate =
      await Igmt4ProcessDataBankResponseSchema.parseAsync(data);
    this.componentData.updateSingleData(dataForPopulate);
  }

  // Add/Remove strokes and drag and drop
  draggedBlock: { id: string; value: string } | null = null;
  starter: number | null = null;

  dragStart(stroke: { id: string; value: string }, index: number) {
    this.draggedBlock = stroke;
    this.starter = index;
  }

  dragEnd() {
    this.draggedBlock = null;
  }

  drop(stroke: { id: string; value: string }, index: number) {
    if (this.starter !== null && this.draggedBlock) {
      const updatedStrokes = [...this.form.controls.strokes.value];
      updatedStrokes.splice(this.starter, 1);
      updatedStrokes.splice(index, 0, this.draggedBlock);
      this.form.controls.strokes.setValue(updatedStrokes);
      this.form.controls.strokes.updateValueAndValidity();
    }
  }

  addStroke(event: KeyboardEvent) {
    if (
      (event.key === "Enter" || event.key === " " || event.key === "Comma") &&
      this.form.controls.singleStroke.valid &&
      this.form.controls.singleStroke.value
    ) {
      const newStroke = {
        id: ulid(),
        value: this.form.controls.singleStroke.value
      };

      const updatedStrokes = [...this.form.controls.strokes.value, newStroke];
      this.form.controls.strokes.setValue(updatedStrokes);
      this.form.controls.strokes.updateValueAndValidity();
      this.form.controls.singleStroke.reset();
    }
  }

  removeStroke(event: MouseEvent, index: number) {
    const updatedStrokes = this.form.controls.strokes.value.filter(
      (_, i) => i !== index
    );
    this.form.controls.strokes.setValue(updatedStrokes);
    this.form.controls.strokes.updateValueAndValidity();
  }

  // form items
  get videos() {
    return this.form.controls.videos;
  }

  addVideo() {
    const stateId = ulid();

    const videoForm = this.fb.group<VideoForm>({
      stateId: new FormControl(stateId, { nonNullable: true }),
      videoNo: new FormControl<number | null>(null, Validators.required),
      videoTitle: new FormControl<string | null>(null, Validators.required),
      videoDesc: new FormControl<string | null>(null),
      videoUrl: new FormControl<string | null>(null, Validators.required),
      processInitOn: new FormControl<string | null>(null, Validators.required)
    });

    this.videos.insert(0, videoForm);
    this.tableData.update((data) => [
      {
        stateId: stateId,
        sewingProcessId: 0,
        videoNo: 0,
        videoTitle: "",
        videoDesc: null,
        videoUrl: "",
        processInitOn: "",
        createdById: 0,
        updatedById: null,
        createdAtUtc: "",
        updatedAtUtc: null
      },
      ...data
    ]);

    this.videos.updateValueAndValidity();
    this.form.markAsDirty();
  }

  populateVideoForm() {
    this.form.reset();
    this.videos.clear();

    this.tableData().forEach((item) => {
      const videoForm = this.fb.group<VideoForm>({
        stateId: new FormControl(item.stateId || ulid(), { nonNullable: true }),
        videoNo: new FormControl<number | null>(
          item.videoNo,
          Validators.required
        ),
        videoTitle: new FormControl<string | null>(
          item.videoTitle,
          Validators.required
        ),
        videoDesc: new FormControl<string | null>(item.videoDesc),
        videoUrl: new FormControl<string | null>(
          item.videoUrl,
          Validators.required
        ),
        processInitOn: new FormControl<string | null>(
          this.formatterService.formatUtcDateTimeToLocalDateTime(
            item.processInitOn
          ),
          Validators.required
        )
      });

      this.videos.push(videoForm);
      this.videos.updateValueAndValidity();
    });
  }

  async removeVideo(data: VideoResponseModel) {
    this.confirmationService.confirm({
      message: "Do you want to delete this record?",
      header: "Delete Video",
      icon: "pi pi-info-circle",
      rejectLabel: "Cancel",
      rejectButtonProps: {
        label: "Cancel",
        severity: "secondary",
        outlined: true
      },
      acceptButtonProps: {
        label: "Delete",
        severity: "danger"
      },
      accept: async () => {
        try {
          const control = this.videos.controls.find(
            (c) => c.get("stateId")?.value === data.stateId
          );
          if (control) {
            const index = this.videos.controls.indexOf(control);

            //remove from table and form
            this.videos.removeAt(index);
            this.tableData.update((data) => {
              const newData = [...data];
              newData.splice(index, 1);
              return newData;
            });
            this.form.markAsDirty();

            //remove the video from s3
            if (control.value.videoUrl) {
              await this.IGMT4ProcessDataBankService.deleteVideo(
                control.value.videoUrl
              );
            }

            //call update api
            if (this.form.valid) {
              await this.update(true);
            }
          }
        } catch (error) {
          throw error;
        }
      }
    });
  }

  viewVideo(videoUrl: string) {
    const finalUrl = environment.MINIO_BUCKET.IGMT4 + videoUrl;
    window.open(finalUrl, "_blank", "noopener,noreferrer");
  }

  // video dialog
  isVideoDialogOpen = signal<boolean>(false);
  currentVideoUrl: string | null = null;

  openVideoDialog(videoUrl: string) {
    this.currentVideoUrl = environment.MINIO_BUCKET.IGMT4 + videoUrl;
    this.isVideoDialogOpen.set(true);
  }

  closeVideoDialog() {
    this.isVideoDialogOpen.set(false);
    this.currentVideoUrl = null;
  }

  async onUploadSuccess(event: FileUploadEvent, index: number) {
    try {
      if (event.originalEvent && "body" in event.originalEvent) {
        const uploadedUrl = event.originalEvent.body;
        if (uploadedUrl) {
          const videoForm = this.videos.at(index);
          if (videoForm) {
            videoForm.patchValue({ videoUrl: uploadedUrl });
          }
          this.tableData.update((data) => {
            const newData = [...data];
            if (newData[index]) {
              newData[index] = { ...newData[index], videoUrl: uploadedUrl };
            }
            return newData;
          });
          if (this.form.valid) {
            await this.update(true);
          }
          this.videos.updateValueAndValidity();
          this.form.markAsDirty();
        }
      }

      await this.toastService.showSuccessToast(
        "Success",
        commonToastMessages.UploadSuccess
      );
    } catch (error) {
      throw error;
    }
  }

  async onUploadError(event: FileUploadErrorEvent) {
    await this.toastService.showErrorToast(
      "Failed",
      commonToastMessages.UploadFailed
    );
  }

  // revise dialog
  isReviseDialogOpen = signal<boolean>(false);

  async openReviseDialog() {
    this.isReviseDialogOpen.set(true);
  }

  closeReviseDialog(event: boolean) {
    this.isReviseDialogOpen.set(event);
  }

  closeSuccessReviseDialog(event: boolean) {
    this.tableState.clearTableData(this.dataTableRef());
    this.isReviseDialogOpen.set(event);
  }

  // revise log dialog
  isReviseLogDialogOpen = signal<boolean>(false);

  openReviseLogDialog() {
    this.isReviseLogDialogOpen.set(true);
  }

  closeReviseLogDialog(event: boolean) {
    this.isReviseLogDialogOpen.set(event);
  }

  // permissions
  readonly hasReadPermission = computed(() => {
    return (
      this.authStore.isSuperAdmin() ||
      this.authStore.matchAblePermissionState.ReadProcessDataBank()
    );
  });
  readonly hasCreatePermission = computed(() => {
    return (
      this.authStore.isSuperAdmin() ||
      this.authStore.matchAblePermissionState.CreateProcessDataBank()
    );
  });

  readonly hasUpdatePermission = computed(() => {
    return (
      this.authStore.isSuperAdmin() ||
      this.authStore.matchAblePermissionState.UpdateProcessDataBank()
    );
  });

  readonly hasRevisePermission = computed(() => {
    return (
      this.authStore.isSuperAdmin() ||
      this.authStore.matchAblePermissionState.ReviseProcessDataBank()
    );
  });

  readonly hasCreateOrUpdatePermission = computed(() => {
    if (this.componentState.manipulationType() === ManipulationType.Create) {
      return this.hasCreatePermission();
    }
    return this.hasUpdatePermission();
  });

  readonly tableHeaders = signal<PrimeNgTableHeader[]>([
    {
      identifier: {
        field: "serial",
        label: "SL"
      }
    },
    {
      identifier: {
        field: "name",
        label: "Process Name"
      }
    },
    {
      identifier: {
        field: "description",
        label: "Description"
      }
    },
    {
      identifier: {
        field: "isDataLocked",
        label: "Is Data Locked?",
        isBoolean: true
      }
    },
    {
      identifier: {
        field: "conditionDescription",
        label: "Condition Desc"
      }
    },
    {
      identifier: {
        field: "isGuideAttach",
        label: "Is Guide Attached?",
        isBoolean: true
      }
    },
    {
      identifier: {
        field: "isFolderAttach",
        label: "Is Folder Attached?",
        isBoolean: true
      }
    },
    {
      identifier: {
        field: "guideFolderDescription",
        label: "Guide/Folder Attc Desc"
      }
    },
    {
      identifier: {
        field: "sewingMachineSpecification",
        label: "M/C Spec"
      }
    },
    {
      identifier: {
        field: "complexity",
        label: "Complexity"
      }
    },
    {
      identifier: {
        field: "standardMinuteValue",
        label: "SMV"
      }
    },
    {
      identifier: {
        field: "strokes",
        label: "Strokes"
      }
    },
    {
      identifier: {
        field: "isSpecialProcess",
        label: "Is Special Process?",
        isBoolean: true
      }
    },
    {
      identifier: {
        field: "seamLengthInCm",
        label: "Seam Length (cm)"
      }
    },
    {
      identifier: {
        field: "numberOfXProcess",
        label: "No. of X Process"
      }
    },
    {
      identifier: {
        field: "frequentDefects",
        label: "Frequent Defects"
      }
    }
  ]).asReadonly();
}
