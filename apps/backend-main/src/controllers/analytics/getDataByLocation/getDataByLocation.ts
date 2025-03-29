import { NextFunction, Request, Response } from "express";
import DeviceModel from "../../../models/deviceModel";
import { Types } from "mongoose";

export const getDataByLocation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { locationId } = req.body;
  
      const devices = await DeviceModel.find({
        microControllerId: new Types.ObjectId(String(locationId)),
      });
  
      if (!devices.length) {
        res.json({ success: true, message: "No device data found" });
      return;
      }
  
      const groupedData: Record<string, { humidity: number[]; temperature: number[]; ppm: number[] }> = {};
      devices.forEach((device) => {
        const dateKey = device.timestamp.toISOString().split("T")[0] as string;
        if (!groupedData[dateKey]) {
          groupedData[dateKey] = { humidity: [], temperature: [], ppm: [] };
        }
        groupedData[dateKey].humidity.push(device.humidity);
        groupedData[dateKey].temperature.push(device.temperature);
        groupedData[dateKey].ppm.push(device.particlePerMillion);
      });
  
      // Compute trends
      const processedData = Object.entries(groupedData).map(([date, values]) => ({
        date,
        avgHumidity: values.humidity.reduce((a, b) => a + b, 0) / values.humidity.length,
        avgTemperature: values.temperature.reduce((a, b) => a + b, 0) / values.temperature.length,
        avgPPM: values.ppm.reduce((a, b) => a + b, 0) / values.ppm.length,
        isDeteriorating:
          values.ppm.some((ppm) => ppm > 400) || values.humidity.some((h) => h < 20),
      }));
  
      res.json({ success: true, data: processedData });
      return;
    } catch (error) {
      next(error);
    }
  };
  