import { Component, OnInit } from '@angular/core';
import { Validators, FormBuilder, FormControl, FormGroup, AbstractControl } from '@angular/forms';
import { KernelConfigAlvDto, InputsService, KernelConfigAlvViewModel } from 'ClientApp/core/services/api.client.generated';
import { Observable, pipe, Subscription } from 'rxjs';
import { Store, Select } from '@ngxs/store';
import { CreateConfigurationAlvState } from 'ClientApp/app/_state/configurations/create-configuration/create-configuration-alv/create-configuration-alv.state';
import { KernelConfigAlvState } from 'ClientApp/app/_state/configurations/create-configuration/create-configuration-alv/kernel-config-alv/kernel-config-alv.state';
import { KernelConfigAlvFacade } from 'ClientApp/app/_state/configurations/create-configuration/create-configuration-alv/kernel-config-alv/kernel-config-alv.facade';
import { debounceTime, map, distinctUntilChanged } from 'rxjs/operators';
import { UniqueNameValidationService } from '../../../validation/unique-name.validation';
import { UniqueDataValidationService } from '../../../validation/unique-data.validation';
import { KeyValue } from '@angular/common';
import { InputsGridState } from 'ClientApp/app/_state/configurations/create-configuration/create-configuration-alv/inputs-grid/inputs-grid.state';
import { ModelParamTypes } from 'ClientApp/app/shared/constants'
import { UserAuthenticationService } from 'ClientApp/app/shared/authentication.service';

@Component({
  selector: 'kernel-config-alv-form',
  templateUrl: './kernel-config-alv-form.component.html',
  styleUrls: ['./kernel-config-alv-form.component.css']
})
export class KernelConfigAlvFormComponent {

    @Select(KernelConfigAlvState.viewModel)
    kernelConfigAlvViewModel$: KernelConfigAlvViewModel;

    @Select(CreateConfigurationAlvState.existingInputs(ModelParamTypes.KernelConfigAlv))
    existingInputs$: Observable<any>;

    @Select(CreateConfigurationAlvState.selectedInput(ModelParamTypes.KernelConfigAlv))
    selectedInputId$: Observable<any>;

    @Select(KernelConfigAlvState.form)
    form$: Observable<any>;

    @Select(InputsGridState.selectedRunTypeIds)
    selectedRunTypeIds$: Observable<number[]>;

    createKernelConfigAlv$: Subscription;
    createKernelConfigSelectedFieldsAlv$: Subscription;

    nameFormControl = this.buildNameFormControl();
    kernelConfigAlvForm: FormGroup;
    willSubmitForm: FormGroup;
    canSubmit = false;

    selectedKernelConfigAlvOptionControl = new FormControl('');

    // INITIALIZATION

    constructor (
        private fb: FormBuilder, 
        public auth: UserAuthenticationService,
        private uniqueNameValidationService: UniqueNameValidationService,
        private uniqueDataValidationService: UniqueDataValidationService,
        private kernelConfigAlvFacade: KernelConfigAlvFacade
    ) { }

    ngOnInit() {
        this.buildForm();
        this.buildWillSubmitForm();
        // register form event handlers
        this.ManagementInvestmentInteractionFrequencyStringOnChange();
        this.GlobalConfigProjectionTypeOnChange();
        this.registerKernelConfigExistingInputsHasChanged();
        this.registerSelectedInputIdHasChanged();
    }

    registerSelectedInputIdHasChanged() {
        this.selectedInputId$
            .subscribe(x => {
                if (x) {
                    this.selectedKernelConfigAlvOptionControl.setValue(x);
                }
            });
    }

    ngOnDestroy() {
        localStorage.setItem('nameFormControl', this.nameFormControl.value);
        this.createKernelConfigAlv$ && this.createKernelConfigAlv$.unsubscribe();
        this.createKernelConfigSelectedFieldsAlv$ && this.createKernelConfigSelectedFieldsAlv$.unsubscribe();
    }

    buildForm() {
        this.kernelConfigAlvForm = this.fb.group({
            // GLOBAL
            //---------- Config -------
            globalConfigRunInParallel: [false],
            //GlobalConfigParallelProcessingProcessorsCalcMethod: ['', Validators.required],
            globalConfigProjectionType: ['LiabilityAndAsset', Validators.required],
            globalConfigParallelProcessingSplitType: ['LiabilityAssetSplit', Validators.required],
            globalConfigProjectionDurationInMonths: ['', Validators.required],
            globalConfigNumberOfProcessors: ['', [Validators.min(1), Validators.required]],
            globalConfigNumberOfSimulations: ['', Validators.required],
            globalConfigSimBlockSize: ['', Validators.required],
            //----------- Global MultiProcessingInfo --------
            globalMultiProcessingInfoBlockSize: ['', Validators.required],
            //------------  Global Result -------------
            globalResultPortfolioSubLevel: ['', Validators.required],
            globalResultOutputTarget: ['', Validators.required],
            globalResultProjectionOutputMonths: ['', Validators.required],
            //--------- MultiProcessingInfo -----------
            resultMultiProcessingInfo: [''],
            //------------- Result ----------------
            resultLevel: ['', Validators.required],
            resultSubLevel: ['', Validators.required],
            resultDebugSimulationNumber: ['', Validators.required],
            resultSummaryOutputVariables: [{value: '', disabled: false}, Validators.required],
            resultDetailedOutputVariables: [{value: '', disabled: false}, Validators.required],
            resultDebugOutputVariables: [{value: '', disabled: false}, Validators.required],
            //(LIABILITY ONLY)
            resultDetailedLiabilityGroupingPropertyName: [''],
            resultDebugLiabilityProperty: [''],
            resultDebugLiabilityValue: [''],
            //(ASSET ONLY)
            resultDebugAssetProperty: [''],
            resultDebugAssetValue: [''],
            //--------- MANAGEMENT -------
            managementInvestmentInteractionFrequencyString: ['Yearly', Validators.required],
            managementInvestmentCalculationExecutionId: ['']
        }, { asyncValidator: this.uniqueDataValidationService.uniqueDataValidator() });
    }

    buildWillSubmitForm() {
        this.willSubmitForm = this.fb.group({
            // GLOBAL
            //---------- Config -------
            globalConfigRunInParallel: [true],
            globalConfigProjectionType: [true],
            globalConfigParallelProcessingSplitType: [true],
            globalConfigProjectionDurationInMonths: [true],
            globalConfigNumberOfProcessors: [true],
            globalConfigNumberOfSimulations: [true],
            globalConfigSimBlockSize: [true],
            //----------- Global MultiProcessingInfo --------
            globalMultiProcessingInfoBlockSize:  [true],
            //------------  Global Result -------------
            globalResultPortfolioSubLevel:  [true],
            globalResultOutputTarget:  [true],
            globalResultProjectionOutputMonths:  [true],
            //--------- MultiProcessingInfo -----------
            resultMultiProcessingInfo: [true],
            //------------- Result ----------------
            resultLevel:  [true],
            resultSubLevel:  [true],
            resultDebugSimulationNumber:  [true],
            resultSummaryOutputVariables:  [true],
            resultDetailedOutputVariables: [true],
            resultDebugOutputVariables:  [true],
            //(LIABILITY ONLY)
            resultDetailedLiabilityGroupingPropertyName:  [true],
            resultDebugLiabilityProperty:  [true],
            resultDebugLiabilityValue:  [true],
            //(ASSET ONLY)
            resultDebugAssetProperty: [true],
            resultDebugAssetValue: [true],
            //--------- MANAGEMENT -------
            managementInvestmentInteractionFrequencyString:  [true],
            managementInvestmentCalculationExecutionId:  [true],
        });

        // listen for checkbox changes to indicate whether its a SelectField type of submit
        this.willSubmitForm
            .valueChanges
            .subscribe(form => {
                this.isSelectedFieldsMode = Object
                    .keys(form)
                    .some(key => !this.willSubmitForm.get(key).value);
            });
    }

    buildNameFormControl() {
        let initialValue = localStorage.hasOwnProperty('nameFormControl') 
            ? localStorage.getItem('nameFormControl')
            : "";
        return new FormControl(initialValue, Validators.required, this.uniqueNameValidationService.uniqueNameValidator());
    }

    registerKernelConfigExistingInputsHasChanged() {
        this.selectedKernelConfigAlvOptionControl
            .valueChanges
            .subscribe(optionId => {
                if (optionId) {
                    this.kernelConfigAlvFacade.getKernelConfigAlv(optionId);
                }
            })
    }


    // FORM VALIDATION

    // ManagementInvestmentCalculationExecutionId is shown only when ManagementInvestmentInteractionFrequencyString value is not 'NONE'
    ManagementInvestmentInteractionFrequencyStringOnChange() {
        this.control('managementInvestmentInteractionFrequencyString')
            .valueChanges
            .subscribe(newValue => {
                let targetControl = this.control('managementInvestmentCalculationExecutionId');
                if (newValue !== "NONE")
                    targetControl.setValidators([Validators.required]);
                else
                    targetControl.clearValidators();
                targetControl.updateValueAndValidity();
            });
    }

    // if asset and/or liability 
    GlobalConfigProjectionTypeOnChange() {
        this.control('globalConfigProjectionType')
            .valueChanges
            .subscribe(newValue => {
                this.clearLiabilityAndAssetFormValidators();
                let targetControl = this.control('globalConfigProjectionType');
                if (newValue === "LiabilityOnly" || newValue === "LiabilityAndAsset")
                    this.addLiabilityFormValidation();
                if (newValue === "AssetOnly" || newValue === "LiabilityAndAsset")
                    this.addAssetFormValidation();
            });
    }

    addLiabilityFormValidation() {
        return [
            'resultDetailedLiabilityGroupingPropertyName',
            'resultDebugLiabilityProperty',
            'resultDebugLiabilityValue'
        ].forEach(x => this.addFormValidationAndEnable(x));
    }

    addAssetFormValidation() {
        return [
            'resultDebugAssetProperty',
            'resultDebugAssetValue'
        ].forEach(x => this.addFormValidationAndEnable(x));
    }

    clearLiabilityAndAssetFormValidators() {
        return [
            'resultDetailedLiabilityGroupingPropertyName',
            'resultDebugLiabilityProperty',
            'resultDebugLiabilityValue',
            'resultDebugAssetProperty',
            'resultDebugAssetValue'
        ].forEach(x => this.clearValidatorsAndDisable(x));
    }

    addFormValidationAndEnable(controlName: string) {
        let targetControl = this.control(controlName);
        targetControl.setValidators([Validators.required]);
        targetControl.updateValueAndValidity();
        targetControl.enable();
    }

    clearValidatorsAndDisable(controlName: string) {
        let targetControl = this.control(controlName);
        targetControl.clearValidators();
        targetControl.updateValueAndValidity();
        targetControl.disable();
    }
    
    // CHECKBOXES
    
    // all feidls will be submitted initially

    isSelectedFieldsMode = false;

    toggleAllWillSubmit(event) {
        this.iterateWillSubmitForm(
            (key) => this.willSubmitForm.get(key).setValue(event.checked)
        );
        //Object.keys(this.kernelConfigAlvForm.controls).forEach(key => {
        //    this.willSubmitForm.get(key).setValue(event.checked);
        //});
    }

    iterateWillSubmitForm(callback) {
        Object.keys(this.kernelConfigAlvForm.controls).forEach(key => {
            callback(key);
        });
    }

    // MENU

    canEnableMenuItems() {
        return true;
    }

    clearForm() {
        this.buildForm();
    }


    // HELPER FUNCTIONS

    control(controlName: string): FormControl {
        return this.kernelConfigAlvForm.get(controlName) as FormControl;
    }

    willSubmitControl(controlName: string): FormControl {
        return this.willSubmitForm.get(controlName) as FormControl;
    }
    

    // FORM SUBMISSION

    addCurrentSelection() {
        this.kernelConfigAlvFacade
            .addSelectionKernelConfigAlv(this.selectedKernelConfigAlvOptionControl.value);
    }
    
    submit(){
        // get all values and then remove controls which are not needed
        let formData = new KernelConfigAlvDto(this.kernelConfigAlvForm.value);
        this.createKernelConfigAlv$ = this.kernelConfigAlvFacade
                .createKernelConfig(this.nameFormControl.value, formData)
                .subscribe((success) => this.onSuccessfullSubmit());
    }

    submitSelectedFields() {
        let selectedFields = [];
        let formData = new KernelConfigAlvDto();
        Object.keys(this.kernelConfigAlvForm.controls).forEach(key => {
            selectedFields.push(key);
            formData[key] = this.kernelConfigAlvForm.get(key).value;
        });
        this.createKernelConfigSelectedFieldsAlv$ = this.kernelConfigAlvFacade
            .createKernelConfigSelectFields(this.nameFormControl.value, selectedFields, formData)
            .subscribe((success) => this.onSuccessfullSubmit());
    }

    onSuccessfullSubmit() {
        this.kernelConfigAlvForm.updateValueAndValidity();
        this.nameFormControl.updateValueAndValidity();
    }

    // MENU

    getCommonSettings() {
        this.kernelConfigAlvFacade.getCommonKernelConfigSettingsAlv()
    }

    // ORDER BY
    // keyvalue pipe has an undesired default order
    // this custom pipe ensures the order is based on lowest to highest
    orderByInputId = (akv: KeyValue<string, number>, bkv: KeyValue<string, number>): number => {
        const a = parseInt(akv.key);
        const b = parseInt(bkv.key);
        return a > b ? 1 : (b > a ? -1 : 0);
    };

    // keyvalue pipe has an undesired default order
    // this custom pipe ensures the order is based on lowest to highest
    orderByFileName = (akv: KeyValue<string, string>, bkv: KeyValue<string, string>): number => {
        return ('' + akv.value).localeCompare(bkv.value);
    };
}
